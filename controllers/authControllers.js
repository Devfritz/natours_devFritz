const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../../model/userSchema");
const errorResponse = require("../../utils/error");
const catchAsync = require("../../utils/catchAsync");
const Email = require("../../utils/sendEmail");

const signTokenResponse = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signTokenResponse(user._id);
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // remove password from output
  user.password = undefined;
  res.status(statusCode).cookie("jwt", token, options).json({
    success: true,
    token,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get("host")}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new errorResponse("Please provide email and password", 400));
    }

    // 2) check if user exist
    const user = await User.findOne({ email }).select("+password");
    const isMatchPassword = await user.matchPassword(password);

    if (!user) {
      return next(new errorResponse("user not found", 401));
    }

    if (!isMatchPassword) {
      return next(new errorResponse(`user or email is incorrect `, 401));
    }

    // 3) if everything ok, send token to  client
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err,
    });
  }
};

exports.logout = async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new errorResponse("not logged in please log in to get access", 401)
    );
  }

  // //   2) verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    // 3) chek if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new errorResponse("user belonging with this token exit anymore", 401)
      );
    }

    // 4) check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new errorResponse(
          "user recently changed password! Please log in again",
          401
        )
      );
    }

    //     grant access to protected route

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    return next(new errorResponse("not authorize to access this route", 401));
  }
});

//  Only for rendered pages , no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) chek if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3) check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //    There is a logged in user
      req.user = currentUser;
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // role ['admin','lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new errorResponse(
          "You do not have permission to perfom this action",
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new errorResponse("There is no user with that email", 404));
  }

  //    generate the random reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    // create reset url  And send it to user's email
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetpassword/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      success: true,
      message: "email sent",
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(new errorResponse("Email could not be sent", 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //   get user based on the token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  // if the token has not expired, and there is user , set the new password
  if (!user) {
    return next(new errorResponse("invalid token", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //    get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //    check if posted current password is correct
  if (!(await user.matchPassword(req.body.passwordCurrent))) {
    return next(new errorResponse("your current password is wrong", 401));
  }
  //   if so , update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //   4) log user in , send JWT
  createSendToken(user, 200, res);
});
