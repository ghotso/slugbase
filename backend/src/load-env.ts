// This file must be imported FIRST before any other modules
// It loads environment variables from the project root .env file
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
// Try multiple paths: from backend/src (dev) or from dist (production)
const envPaths = [
  join(__dirname, '../../.env'), // From backend/src or dist
  join(process.cwd(), '../.env'), // From backend directory
  join(process.cwd(), '.env'), // From current working directory
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      envLoaded = true;
      console.log(`Loaded .env from: ${envPath}`);
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

// Fallback to default dotenv behavior
if (!envLoaded) {
  dotenv.config();
}
