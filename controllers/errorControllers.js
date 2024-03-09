const errorResponse = require("./../utils/error");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new errorResponse(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value} Please use another value`;
  return new errorResponse(message, 400);
};

const handleJWTError = () => {
  new errorResponse("Invalid token. Please log in again", 401);
};

const handleJWTExpiresError = () => {
  new errorResponse("Your token has expired !. Please log in again", 401);
};

const handleValidationDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input Data. ${errors.join(". ")}`;
  return new errorResponse(message, 400);
};
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      success: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Rendered Website
  return res.status(err.statusCode).render("error", {
    title: "something went wrong",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //------------------------  for API

  if (req.originalUrl.startsWith("/api")) {
    //  Operational , trusted error: send message to

    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: err.status,
        message: err.message,
      });
    }
    //----------- Programming or other unknow error:don't leak error details

    //  1) log error
    console.error("Error 💥", err);

    // 2) send generic message
    return res.status(500).json({
      success: false,
      message: "Something went very wrong",
    });
  }

  //----------------------- For Render website

  //  Operational , trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  // Programming or other unknow error:don't leak error details
  //  1) log error
  console.error("Error 💥", err);

  // 2) send generic message
  return res.status(err.statusCode).render("error", {
    title: "something went wrong",
    msg: " Please try Again later!.",
  });
};

module.exports = (err, req, res, next) => {
  console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError") error = handleValidationDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiresError(error);

    sendErrorProd(error, req, res);
  }
};
