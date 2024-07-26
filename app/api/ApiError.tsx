// src/api/ApiError.ts

export default class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public maxAttempts: number = 3
  ) {
    super(message);
    this.name = "ApiError";
  }
}
