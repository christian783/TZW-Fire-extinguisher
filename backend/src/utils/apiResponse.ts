type SuccessPayload = {
  statusCode?: number;
  message?: string;
  data?: unknown;
  total?: number;
  page?: number;
  totalPages?: number;
};

export const sendSuccess = (res, { statusCode = 200, message = "", data = {}, total = 0, page = 1, totalPages = 1 }: SuccessPayload) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    total,
    page,
    totalPages
  });
};
