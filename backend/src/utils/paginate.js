const paginate = async (model, query = {}, page = 1, limit = 10) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (normalizedPage - 1) * normalizedLimit;

  const { count, rows } = await model.findAndCountAll({
    ...query,
    limit: normalizedLimit,
    offset
  });

  return {
    total: count,
    page: normalizedPage,
    totalPages: Math.max(Math.ceil(count / normalizedLimit), 1),
    data: rows
  };
};

module.exports = paginate;
