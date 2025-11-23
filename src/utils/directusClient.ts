import { createDirectus, rest, authentication } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DIRECTUS_URL) {
  throw new Error('DIRECTUS_URL is not defined in environment variables');
}

const directus = createDirectus(process.env.DIRECTUS_URL)
  .with(authentication('json'))
  .with(rest());

let isAuthenticated = false;

export async function ensureAuth() {
  // Nếu đã auth thì không cần auth lại
  if (isAuthenticated) {
    return;
  }

  try {
    if (!process.env.DIRECTUS_EMAIL || !process.env.DIRECTUS_PASSWORD) {
      throw new Error('DIRECTUS_EMAIL or DIRECTUS_PASSWORD is not defined');
    }

    await directus.login({
      email: process.env.DIRECTUS_EMAIL,
      password: process.env.DIRECTUS_PASSWORD
    });
    
    isAuthenticated = true;
    console.log('✅ Authenticated with Directus as:', process.env.DIRECTUS_EMAIL);
  } catch (error: any) {
    isAuthenticated = false;
    console.error('❌ Failed to authenticate with Directus:', error?.message || error);
    throw error;
  }
}

// Auto-refresh token khi hết hạn
setInterval(async () => {
  if (isAuthenticated) {
    try {
      await directus.refresh();
      console.log('🔄 Token refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      isAuthenticated = false;
      // Thử login lại
      await ensureAuth();
    }
  }
}, 10 * 60 * 1000); // Mỗi 10 phút

export { directus };
