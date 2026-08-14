export type ApiError = {
  errors: Record<string, string | string[]>;
  status: number;
};

export const NETWORK_ERROR: ApiError = {
  errors: { network: ['Unable to connect. Please check your internet connection.'] },
  status: 0,
};

export function toApiError(body: unknown, status: number): ApiError {
  if (body && typeof body === 'object' && 'errors' in body) {
    return { ...(body as object), status } as ApiError;
  }

  return { ...NETWORK_ERROR, status };
}
