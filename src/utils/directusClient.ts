import { createDirectus, rest, authentication } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config();

const directus = createDirectus(process.env.DIRECTUS_URL!)
  .with(authentication('json'))
  .with(rest());

export async function ensureAuth() {
  try {
    await directus.login(process.env.DIRECTUS_EMAIL!, process.env.DIRECTUS_PASSWORD!);
    console.log('✅ Authenticated with Directus');
  } catch (error) {
    console.error('❌ Failed to authenticate with Directus:', error);
    throw error;
  }
}

export { directus };
