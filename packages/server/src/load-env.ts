import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

// Optional shared environment variables (.env)
// do not duplicate PORT in .env if per-environment .env file (e.g. .env.production or .env.development) sets it
// because the per-environment .env files won't be able to override the PORT key set by .env
config({ path: resolve(packageRoot, '.env') });

// Per-environment values. Default `dotenv` does not override keys already set
// (e.g. PORT from Railway/Docker), so production injectors keep working.
config({ path: resolve(packageRoot, `.env.${mode}`) });
