// server
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message, err.stack);
  console.log('UNHANDLED EXCEPTION 🐱‍🏍 : shutting down server!');
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    autoIndex: true,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB con succesful');
  });

const port = process.env.PORT || 3300;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}..`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION 🐱‍🏍 : shutting down server!');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
