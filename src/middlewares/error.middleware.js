import logger from "../utils/logger.util.js";

const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// 🔥 helper: detect JSON messages (Zod errors)
const parseMessage = (message) => {
  try {
    return JSON.parse(message);
  } catch {
    return message;
  }
};

const sendProdError = (err, res) => {
  // 🔥 Operational errors (trusted errors)
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      status: err.status || "error",
      message: parseMessage(err.message),
    });
  }

  // ❌ Programming / unknown errors
  logger.error("UNEXPECTED ERROR:", err);

  return res.status(500)?.json({
    status: "error",
    message: "Something went wrong",
  });
};

const globalErrorHandler = (err, req, res, next) => {
  // 🔥 default fallback
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // 🔥 structured logging
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // 🔥 environment switch
  if (process.env.NODE_ENV === "development") {
    return sendDevError(err, res);
  }

  return sendProdError(err, res);
};

export default globalErrorHandler;