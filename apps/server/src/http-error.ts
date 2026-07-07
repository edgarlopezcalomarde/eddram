/** Thrown by route handlers; mapped to a JSON response by the global onError. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) =>
  new HttpError(404, "NOT_FOUND", `${what} no encontrado`);
