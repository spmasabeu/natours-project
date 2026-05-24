const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

//security http headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          "'unsafe-inline'",
          'blob:',
        ],
        styleSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
          "'unsafe-inline'",
        ],
        workerSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", 'https://*.mapbox.com', 'ws://127.0.0.1:1234'],
        imgSrc: ["'self'", 'data:', 'https://*.mapbox.com'],
        fontSrc: [
          "'self'",
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
        ],
      },
    },
  }),
);

// dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// rate limiting from api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this Ip, please try again in an hour!',
});

app.use('/api', limiter);

// body parser reading dara from body intro req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against nosql query injection
app.use(mongoSanitize());

// data sanitization agains XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratinsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

// test middleware
app.use((req, res, next) => {
  console.log('hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

app.get('/api/v1/config', (req, res) => {
  const mapboxAccessToken = (process.env.MAPBOX_ACCESS_TOKEN || '')
    .trim()
    .replace(/^['"]|['"];?$/g, '')
    .replace(/;$/, '');

  res.status(200).json({
    status: 'success',
    data: {
      mapboxAccessToken,
    },
  });
});

// routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all(/.*/, (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error('some error occur');
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
