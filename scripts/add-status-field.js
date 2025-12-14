/**
 * Script to add 'status' field to monthly_payrolls collection in Directus
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'Admin123!';

async function addStatusField() {
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
    
    // Step 2: Create the status field
    console.log('\n📝 Creating status field in monthly_payrolls...');
    
    const fieldDefinition = {
      field: 'status',
      type: 'string',
      schema: {
        name: 'status',
        table: 'monthly_payrolls',
        data_type: 'varchar',
        default_value: 'draft',
        max_length: 50,
        is_nullable: false
      },
      meta: {
        collection: 'monthly_payrolls',
        field: 'status',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Draft', value: 'draft' },
            { text: 'Pending Approval', value: 'pending_approval' },
            { text: 'Approved', value: 'approved' },
            { text: 'Paid', value: 'paid' }
          ]
        },
        display: 'labels',
        display_options: {
          choices: [
            { text: 'Draft', value: 'draft', foreground: '#6B7280', background: '#F3F4F6' },
            { text: 'Pending Approval', value: 'pending_approval', foreground: '#D97706', background: '#FEF3C7' },
            { text: 'Approved', value: 'approved', foreground: '#059669', background: '#D1FAE5' },
            { text: 'Paid', value: 'paid', foreground: '#2563EB', background: '#DBEAFE' }
          ]
        },
        note: 'Payroll status workflow: draft → pending_approval → approved → paid',
        sort: 5,
        width: 'half'
      }
    };
    
    const createResponse = await fetch(`${DIRECTUS_URL}/fields/monthly_payrolls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldDefinition)
    });
    
    console.log('Create response status:', createResponse.status);
    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ Status field created successfully!');
      console.log('Field details:', JSON.stringify(createResult.data, null, 2));
    } else {
      console.log('❌ Failed to create field:', JSON.stringify(createResult, null, 2));
      
      // If field already exists, that's also OK
      if (createResult.errors?.[0]?.extensions?.code === 'FIELD_ALREADY_EXISTS') {
        console.log('ℹ️  Field already exists, which is fine.');
      }
    }
    
    // Step 3: Update existing records to have 'draft' status
    console.log('\n📝 Updating existing payrolls to have draft status...');
    
    // First get all payrolls
    const listResponse = await fetch(`${DIRECTUS_URL}/items/monthly_payrolls?limit=-1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    const listData = await listResponse.json();
    console.log(`Found ${listData.data?.length || 0} payrolls`);
    
    // Update each one
    for (const payroll of (listData.data || [])) {
      if (!payroll.status) {
        await fetch(`${DIRECTUS_URL}/items/monthly_payrolls/${payroll.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'draft' })
        });
        console.log(`  Updated payroll ${payroll.id.substring(0, 8)}... to draft`);
      }
    }
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addStatusField();
