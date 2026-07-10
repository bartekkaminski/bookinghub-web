export type ApiErrorCode =
  | 'Unauthorized'
  | 'Forbidden'
  | 'NotFound'
  | 'Conflict'
  | 'ValidationError'
  | 'ServerError'
  | 'OrganizationCreationLimitReached'
  | 'OrganizationNameTaken'
  | string

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isNotFound() { return this.status === 404 }
  get isConflict() { return this.status === 409 }
  get isValidation() { return this.status === 400 || this.status === 422 }
  get isCreationLimitReached() { return this.code === 'OrganizationCreationLimitReached' }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Nieznany błąd'
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
  if (error instanceof ApiError && error.details) return error.details
  return {}
}
