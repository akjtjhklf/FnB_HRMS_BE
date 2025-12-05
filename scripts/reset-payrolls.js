/**
 * Reset all payrolls to draft status for testing
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'Admin123!';

async function resetPayrolls() {
  console.log('🔐 Authenticating with Directus...');
  
  try {
    const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: DIRECTUS_EMAIL,
        password: DIRECTUS_PASSWORD
      })
    });
    
    const loginData = await loginResponse.json();
    const accessToken = loginData.data.access_token;
    console.log('✅ Authenticated successfully');
    
    // Get all payrolls
    const listResponse = await fetch(`${DIRECTUS_URL}/items/monthly_payrolls?limit=-1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    const listData = await listResponse.json();
    console.log(`Found ${listData.data?.length || 0} payrolls`);
    
    // Reset each one to draft
    for (const payroll of (listData.data || [])) {
      await fetch(`${DIRECTUS_URL}/items/monthly_payrolls/${payroll.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'draft' })
      });
      console.log(`  Reset payroll ${payroll.id.substring(0, 8)}... to draft`);
    }
    
    console.log('\n✅ All payrolls reset to draft!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPayrolls();
