import { z } from 'zod';

const environmentSchema = z.object({
  VITE_API_BASE_URL: z.url(),
});

const result = environmentSchema.safeParse(import.meta.env);

if (!result.success) {
  throw new Error(
    `Invalid environment configuration: ${z.prettifyError(result.error)}`,
  );
}

export const env = Object.freeze(result.data);
