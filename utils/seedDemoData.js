const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');

const readJson = (fileName) =>
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', 'dev-data', 'data', fileName),
      'utf-8',
    ),
  );

const seedDemoDataIfEmpty = async () => {
  const tourCount = await Tour.countDocuments();
  if (tourCount > 0) return;

  const tours = readJson('tours.json');
  const users = readJson('users.json').map((user) => ({
    ...user,
    _id: new mongoose.Types.ObjectId(user._id),
  }));
  const reviews = readJson('reviews.json');

  await Tour.create(tours);
  await User.collection.insertMany(users);
  await Review.create(reviews);

  console.log('Demo data loaded');
};

module.exports = seedDemoDataIfEmpty;
