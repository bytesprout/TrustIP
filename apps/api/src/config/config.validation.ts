import { ApiEnvSchema } from '@trustip/shared-config';

export function validate(config: Record<string, unknown>): Record<string, unknown> {
  const result = ApiEnvSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(
      `❌ Invalid environment configuration:\n${JSON.stringify(formatted, null, 2)}`,
    );
  }

  return result.data as unknown as Record<string, unknown>;
}
