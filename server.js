// server
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message, err.stack);
  console.log('UNHANDLED EXCEPTION: shutting down server!');
  process.exit(1);
});

const app = require('./app');
const seedDemoDataIfEmpty = require('./utils/seedDemoData');

let server;
let memoryServer;

const shouldUseMemoryDb = () =>
  process.env.USE_MEMORY_DB === 'true' || !process.env.DATABASE;

const getDatabaseUri = async () => {
  if (!shouldUseMemoryDb()) {
    return process.env.DATABASE.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD || '',
    );
  }

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'natours',
    },
  });

  return memoryServer.getUri();
};

const startServer = async () => {
  const DB = await getDatabaseUri();

  await mongoose.connect(DB, {
    autoIndex: true,
  });

  console.log(
    shouldUseMemoryDb()
      ? 'In-memory MongoDB connected'
      : 'DB connection successful',
  );

  if (shouldUseMemoryDb() || process.env.AUTO_SEED === 'true') {
    await seedDemoDataIfEmpty();
  }

  const port = process.env.PORT || 3300;
  server = app.listen(port, () => {
    console.log(`app running on port ${port}..`);
  });
};

startServer().catch((err) => {
  console.log('SERVER STARTUP ERROR:', err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION: shutting down server!');
  console.log(err.name, err.message);
  if (!server) process.exit(1);
  server.close(async () => {
    if (memoryServer) await memoryServer.stop();
    process.exit(1);
  });
});
