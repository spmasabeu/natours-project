/* eslint-disable arrow-body-style */
// const fs = require('fs');
// const qs = require('qs');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const factory = require('./handlerFactory');

exports.bookTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  const existingBooking = await Booking.findOne({
    tour: tour.id,
    user: req.user.id,
  });

  if (existingBooking) {
    return res.status(200).json({
      status: 'success',
      message: 'Tour already booked',
      data: {
        booking: existingBooking,
      },
    });
  }

  const booking = await Booking.create({
    tour: tour.id,
    user: req.user.id,
    price: tour.price,
  });

  res.status(201).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
