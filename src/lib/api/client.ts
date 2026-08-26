import type { ApiResponse } from "./response";

export class ApiClientError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function fetchApi<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  let payload: ApiResponse<T>;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "INVALID_API_RESPONSE",
      "The server returned an invalid response.",
      response.status,
    );
  }

  if (!payload.ok) {
    throw new ApiClientError(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details,
    );
  }

  return payload.data;
}
