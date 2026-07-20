/** 404 handler for unmatched routes. */
export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
};

/** Centralized error handler — keeps stack traces out of API responses. */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("[error]", err.message);

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid report id." });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong on our end." : err.message,
  });
};
