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

const getGenericUserName = (user, counters) => {
  if (user.role === 'admin') return 'Demo Admin';
  if (user.role === 'lead-guide') {
    counters.leadGuide += 1;
    return `Demo Lead Guide ${counters.leadGuide}`;
  }
  if (user.role === 'guide') {
    counters.guide += 1;
    return `Demo Guide ${counters.guide}`;
  }
  counters.user += 1;
  return `Demo User ${counters.user}`;
};

const anonymizeUsers = (users) => {
  const counters = {
    user: 0,
    guide: 0,
    leadGuide: 0,
  };

  return users.map((user) => ({
    ...user,
    _id: new mongoose.Types.ObjectId(user._id),
    name: getGenericUserName(user, counters),
    photo: 'default.jpg',
  }));
};

const seedDemoDataIfEmpty = async () => {
  const tourCount = await Tour.countDocuments();
  if (tourCount > 0) return;

  const tours = readJson('tours.json');
  const users = anonymizeUsers(readJson('users.json'));
  const reviews = readJson('reviews.json');

  await Tour.create(tours);
  await User.collection.insertMany(users);
  await Review.create(reviews);

  console.log('Demo data loaded');
};

module.exports = seedDemoDataIfEmpty;
