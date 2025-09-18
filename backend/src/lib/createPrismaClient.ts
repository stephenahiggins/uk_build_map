import { Prisma, PrismaClient } from '@prisma/client';

type PrismaClientOptionsWithTracing = Prisma.PrismaClientOptions & {
  enableTracing?: boolean;
};

function resolveTracingFlag(value: boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  const envValue = process.env.PRISMA_ENABLE_TRACING;
  if (typeof envValue === 'string') {
    return envValue.toLowerCase() === 'true';
  }

  return false;
}

export function createPrismaClient(
  options?: Prisma.PrismaClientOptions
): PrismaClient {
  const mergedOptions: PrismaClientOptionsWithTracing = {
    ...(options ?? {}),
  };

  mergedOptions.enableTracing = resolveTracingFlag(
    (options as PrismaClientOptionsWithTracing | undefined)?.enableTracing
  );

  return new PrismaClient(mergedOptions);
}
