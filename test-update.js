/**
 * Test script to directly update Directus with authentication
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'Admin123!';

async function testDirectFetch() {
  console.log('🔐 Authenticating with Directus...');
  
  try {
    // Step 1: Login to get token
    const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: DIRECTUS_EMAIL,
        password: DIRECTUS_PASSWORD
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const accessToken = loginData.data.access_token;
    console.log('✅ Authenticated successfully');
    
    // Step 2: Get collection schema
    console.log('\n📋 Fetching collection schema...');
    const schemaResponse = await fetch(`${DIRECTUS_URL}/fields/monthly_payrolls`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    const schemaData = await schemaResponse.json();
    const fieldNames = schemaData.data?.map(f => f.field).sort();
    console.log('Fields in monthly_payrolls:', fieldNames);
    
    // Check required fields
    const requiredFields = ['status', 'approved_at', 'approved_by', 'paid_at'];
    const missingFields = requiredFields.filter(f => !fieldNames.includes(f));
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing fields:', missingFields);
      console.log('You may need to run add-missing-fields.js to add these.');
    } else {
      console.log('\n✅ All required fields exist!');
    }
    
    // Step 3: Get payrolls
    console.log('\n📋 Fetching all payrolls...');
    const listResponse = await fetch(`${DIRECTUS_URL}/items/monthly_payrolls?limit=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const listData = await listResponse.json();
    console.log('Payrolls found:', listData.data?.length || 0);
    
    if (listData.data && listData.data.length > 0) {
      console.log('All payroll statuses:', listData.data.map(p => ({ id: p.id.substring(0,8), status: p.status })));
    }
    
    if (!listData.data || listData.data.length === 0) {
      console.log('No payrolls found to test');
      return;
    }
    
    const payroll = listData.data[0];
    console.log('Testing with payroll:', {
      id: payroll.id,
      current_status: payroll.status,
      employee: payroll.employee
    });
    
    // Step 3: Try to update status
    console.log('\n📝 Updating status to pending_approval...');
    const updateResponse = await fetch(`${DIRECTUS_URL}/items/monthly_payrolls/${payroll.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'pending_approval'
      })
    });
    
    console.log('Update response status:', updateResponse.status);
    const updateResult = await updateResponse.json();
    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    
    if (updateResponse.ok) {
      console.log('\n✅ Update successful! New status:', updateResult.data?.status);
      
      // Verify the update
      console.log('\n🔍 Verifying update...');
      const verifyResponse = await fetch(`${DIRECTUS_URL}/items/monthly_payrolls/${payroll.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      const verifyData = await verifyResponse.json();
      console.log('Verified status:', verifyData.data?.status);
    } else {
      console.log('\n❌ Update failed!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectFetch();
