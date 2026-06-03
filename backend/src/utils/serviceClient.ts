import { AppError } from "../middleware/errorHandler";

export const getAuthorizationHeader = (req) => {
  const authorization = req.headers?.authorization;
  return typeof authorization === "string" ? authorization : "";
};

export const fetchServiceJson = async (url: URL, authorization?: string) => {
  const response = await fetch(url, {
    headers: {
      ...(authorization ? { Authorization: authorization } : {})
    }
  });

  if (!response.ok) {
    throw new AppError(`Service request failed: ${url.pathname}`, response.status);
  }

  return response.json();
};

export const sendServiceJson = async (url: URL, method: string, payload: unknown, authorization?: string) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new AppError(`Service request failed: ${url.pathname}`, response.status);
  }

  return response.json();
};
