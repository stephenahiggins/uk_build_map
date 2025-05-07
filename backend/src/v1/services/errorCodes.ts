export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRISMA_CONFLICT = 'PRISMA_CONFLICT',
  PRISMA_NOT_FOUND = 'PRISMA_NOT_FOUND',
  PRISMA_UNKNOWN = 'PRISMA_UNKNOWN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ApiErrorMetadata {
  code: ErrorCode;
  message: string;
  details?: any;
}

export const errorMetadata = {
  VALIDATION_ERROR: {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
  },
  PRISMA_CONFLICT: {
    code: ErrorCode.PRISMA_CONFLICT,
    message: 'Resource already exists',
  },
  PRISMA_NOT_FOUND: {
    code: ErrorCode.PRISMA_NOT_FOUND,
    message: 'Resource not found',
  },
  PRISMA_UNKNOWN: {
    code: ErrorCode.PRISMA_UNKNOWN,
    message: 'Database error',
  },
  INTERNAL_ERROR: {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
  },
};
