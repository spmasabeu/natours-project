const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    espires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // name: req.body.name,
    // email: req.body.email,
    // password: req.body.password,
    // passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role
    ...req.body,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // check if email and password exist
  if (!email || !password) {
    next(new AppError('Please provide email and pasword', 400));
  }

  //check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // console.log(user);
  // if everything is ok send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1 getting token n check of it's there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You have not logged in! please log in to get access', 401),
    );
  }

  // 2 validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3 check if users still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'the user belonging to this token does not longer exist.',
        401,
      ),
    );
  }
  // 4 check if user changed pw after jwt was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, log again!', 401),
    );
  }

  // grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1 verifu token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2 check if users still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 3 check if user changed pw after jwt was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // the is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403),
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 gert user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this address'), 404);
  }
  // 2 generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3 send it to users emails
  // const message = `Forgot password ? submit a patch request with your new password and password copnfirm to ${resetUrl}.\n If you didn't forget your password, please ignore this email.`;
  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('there was an error sending the email. Try again later'),
      500,
    );
  }
});

exports.resetPassword = async (req, res, next) => {
  // 1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2 if token has not expiren, and there iur user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  // console.log(req.body);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3 update changedpasswordat property for the user

  // 4 log the user in, send jwt
  createSendToken(user, 200, res);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 get user from collecion
  const user = await User.findById(req.user.id).select('+password');

  // 2 check if the posted current pw is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(
      new AppError('Incorrect password, please provide a valid password.', 401),
    );

  // 3 if is correct update pw
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // user.findByIdAndUpdate do not use !

  // 4 log user in and send jwt
  createSendToken(user, 200, res);
});
