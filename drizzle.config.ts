import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/server/schema.ts',
  out: './migrations',
  driver: 'turso',
  dbCredentials: {
    url: process.env.VITE_TURSO_DB_URL!,
    authToken: process.env.VITE_TURSO_DB_TOKEN!,
  },
} satisfies Config;