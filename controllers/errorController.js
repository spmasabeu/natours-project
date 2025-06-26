/* eslint-disable node/no-unsupported-features/es-syntax */
const AppError = require('../utils/appError');

const handleJWTError = () => AppError('Invalid JWT. Please log again', 401);

const handleJWTExpiredError = () =>
  AppError('Ypur token has expires, please log again', 401);

const handleCastErrorDB = (err) => {
  const message = `Invalid error ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateFields = (err) => {
  const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // console.log(value);
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went worng!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // console.log('error ! ');
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong!',
    });
  }

  // RENDERED WEBSITE
  if (err.isOperational) {
    console.log('error ! ', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went worng!',
      msg: err.message,
    });
  }
  console.log('error ! ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went worng!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFields(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    // console.log(error.message);
    sendErrorProd(error, req, res);
  }
};
