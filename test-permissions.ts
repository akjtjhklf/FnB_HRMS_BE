import { createDirectus, rest, authentication, readItems, createItems } from '@directus/sdk';

const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';

async function testPermissions() {
  const directus = createDirectus(directusUrl)
    .with(authentication('json'))
    .with(rest());

  try {
    // Login
    await directus.login(
      process.env.ADMIN_EMAIL || 'admin@example.com',
      process.env.ADMIN_PASSWORD || 'password'
    );
    
    console.log('✅ Authenticated');

    // Test reading weekly_schedules
    console.log('\n📖 Testing READ permission for weekly_schedules...');
    const schedules = await directus.request(readItems('weekly_schedules', { limit: 1 }));
    console.log('✅ READ permission OK:', schedules);

    // Test creating weekly_schedules
    console.log('\n📝 Testing CREATE permission for weekly_schedules...');
    const testData = [{
      week_start: '2024-01-01',
      week_end: '2024-01-07',
      status: 'draft',
    }];
    const created = await directus.request(createItems('weekly_schedules', testData));
    console.log('✅ CREATE permission OK:', created);

  } catch (error: any) {
    console.error('❌ Error:', error?.errors?.[0]?.message || error.message);
    console.error('Response:', error?.response?.status, error?.response?.statusText);
  }
}

testPermissions();
