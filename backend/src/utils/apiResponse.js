const sendSuccess = (res, { statusCode = 200, message = "", data = {}, total = 0, page = 1, totalPages = 1 }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    total,
    page,
    totalPages
  });
};

module.exports = {
  sendSuccess
};
