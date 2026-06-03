const hopByHopHeaders = new Set(["connection", "content-length", "host", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]);

const buildHeaders = (req) => {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (hopByHopHeaders.has(key.toLowerCase()) || typeof value === "undefined") {
      return;
    }

    headers.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });

  headers.set("x-forwarded-method", req.method);
  headers.set("x-forwarded-path", req.originalUrl);

  return headers;
};

const proxyToService = (targetBaseUrl: string, publicPrefix: string, servicePrefix: string) => {
  return async (req, res, next) => {
    try {
      const forwardedPath = req.originalUrl.replace(publicPrefix, servicePrefix);
      const targetUrl = new URL(forwardedPath, targetBaseUrl);
      const hasBody = !["GET", "HEAD"].includes(req.method) && typeof req.body !== "undefined";

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: buildHeaders(req),
        body: hasBody ? JSON.stringify(req.body) : undefined
      });

      response.headers.forEach((value, key) => {
        if (!hopByHopHeaders.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.status(response.status).send(buffer);
    } catch (error) {
      next(error);
    }
  };
};

export default proxyToService;
