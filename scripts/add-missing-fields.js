/**
 * Script to add missing fields to monthly_payrolls collection in Directus
 */

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'Admin123!';

async function addMissingFields() {
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
    
    // Get existing fields
    const schemaResponse = await fetch(`${DIRECTUS_URL}/fields/monthly_payrolls`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    const schemaData = await schemaResponse.json();
    const existingFields = schemaData.data?.map(f => f.field) || [];
    
    // Define missing fields
    const fieldsToAdd = [
      {
        field: 'approved_at',
        type: 'timestamp',
        schema: {
          name: 'approved_at',
          table: 'monthly_payrolls',
          data_type: 'timestamp',
          is_nullable: true
        },
        meta: {
          collection: 'monthly_payrolls',
          field: 'approved_at',
          interface: 'datetime',
          display: 'datetime',
          note: 'Timestamp when payroll was approved',
          readonly: true,
          width: 'half'
        }
      },
      {
        field: 'approved_by',
        type: 'uuid',
        schema: {
          name: 'approved_by',
          table: 'monthly_payrolls',
          data_type: 'uuid',
          is_nullable: true
        },
        meta: {
          collection: 'monthly_payrolls',
          field: 'approved_by',
          interface: 'select-dropdown-m2o',
          display: 'related-values',
          display_options: {
            template: '{{first_name}} {{last_name}}'
          },
          note: 'User who approved this payroll',
          width: 'half',
          special: ['m2o']
        }
      },
      {
        field: 'paid_at',
        type: 'timestamp',
        schema: {
          name: 'paid_at',
          table: 'monthly_payrolls',
          data_type: 'timestamp',
          is_nullable: true
        },
        meta: {
          collection: 'monthly_payrolls',
          field: 'paid_at',
          interface: 'datetime',
          display: 'datetime',
          note: 'Timestamp when payroll was paid',
          readonly: true,
          width: 'half'
        }
      }
    ];
    
    // Add each missing field
    for (const fieldDef of fieldsToAdd) {
      if (existingFields.includes(fieldDef.field)) {
        console.log(`⏭️  Field "${fieldDef.field}" already exists, skipping...`);
        continue;
      }
      
      console.log(`\n📝 Creating field "${fieldDef.field}"...`);
      
      const createResponse = await fetch(`${DIRECTUS_URL}/fields/monthly_payrolls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldDef)
      });
      
      if (createResponse.ok) {
        console.log(`✅ Field "${fieldDef.field}" created successfully!`);
      } else {
        const error = await createResponse.json();
        console.log(`❌ Failed to create field "${fieldDef.field}":`, error.errors?.[0]?.message || error);
      }
    }
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingFields();
