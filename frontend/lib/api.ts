/** API client utilities */

import * as Sentry from "@sentry/nextjs";

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").trim() || "/api";

export class ApiError extends Error {
  /** Retry-After header value (for 429 errors) */
  public retryAfter?: string;

  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    retryAfter?: string
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
    this.retryAfter = retryAfter;
  }

  /** Check if this is a rate limit error */
  isRateLimitError(): boolean {
    return this.status === 429;
  }
}

/**
 * Generic API request function with Sentry integration
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options?.method || "GET";

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",  // Include cookies for authentication
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Response body를 복제하여 여러 번 읽을 수 있도록 함
      const clonedResponse = response.clone();
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기
        try {
          errorData = await clonedResponse.text();
        } catch {
          // 텍스트 읽기도 실패하면 빈 객체
          errorData = { detail: response.statusText };
        }
      }

      // 429 에러 시 Retry-After 헤더 읽기
      const retryAfter = response.status === 429
        ? response.headers.get("Retry-After") ?? undefined
        : undefined;

      const apiError = new ApiError(
        response.status,
        response.statusText,
        errorData,
        retryAfter
      );

      // 5xx 에러만 Sentry에 보고 (4xx는 사용자 에러)
      // 단, 429는 rate limit이므로 별도 처리
      if (response.status >= 500) {
        Sentry.captureException(apiError, {
          tags: {
            api_endpoint: endpoint,
            http_method: method,
            http_status: response.status,
          },
          extra: {
            response_data: errorData,
            url: url,
          },
        });
      }

      throw apiError;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text() as unknown as T;
  } catch (error) {
    // 네트워크 에러 처리 (fetch 자체 실패)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      Sentry.captureException(error, {
        tags: {
          error_type: "network_error",
          api_endpoint: endpoint,
          http_method: method,
        },
        extra: {
          url: url,
        },
      });
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}
