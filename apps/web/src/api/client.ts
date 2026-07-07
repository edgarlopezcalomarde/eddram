import type { ApiError } from "@workspace/shared"
import axios, { AxiosError } from "axios"

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})

// Normalize server errors ({ error, message }) into Error.message so
// callers and toasts can just show err.message.
api.interceptors.response.use(undefined, (error: AxiosError<ApiError>) => {
  const message =
    error.response?.data?.message ?? error.message ?? "Error de red"
  return Promise.reject(new Error(message))
})
