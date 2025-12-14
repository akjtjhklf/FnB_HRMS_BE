/**
 * ============================================================================
 * SETUP EMPLOYEE PERMISSIONS SCRIPT
 * ============================================================================
 * 
 * Script này setup permissions cho Employee Policy:
 * - READ employees (chỉ employee của chính user đó)
 * - READ positions, shift_types, shifts, etc.
 * - CREATE/UPDATE employee_availability (đăng ký ca)
 * 
 * Author: Senior Backend Developer
 * Date: 2025-12-07
 * ============================================================================
 */

import 'dotenv/config';
import { getAuthToken } from '../src/utils/directusClient';

const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';

interface Permission {
  collection: string;
  action: 'create' | 'read' | 'update' | 'delete';
  permissions: any;
  validation: any;
  fields: string[];
}

// Permissions cho Employee Policy
const EMPLOYEE_PERMISSIONS: Permission[] = [
  // READ own employee record
  {
    collection: 'employees',
    action: 'read',
    permissions: {
      _and: [
        { user_id: { _eq: '$CURRENT_USER' } }
      ]
    },
    validation: null,
    fields: ['*']
  },
  
  // UPDATE own employee record (limited fields)
  {
    collection: 'employees',
    action: 'update',
    permissions: {
      _and: [
        { user_id: { _eq: '$CURRENT_USER' } }
      ]
    },
    validation: null,
    fields: ['phone', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'photo_url']
  },
  
  // READ positions
  {
    collection: 'positions',
    action: 'read',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // READ shift_types
  {
    collection: 'shift_types',
    action: 'read',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // READ shifts
  {
    collection: 'shifts',
    action: 'read',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // READ weekly_schedule
  {
    collection: 'weekly_schedule',
    action: 'read',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // READ shift_position_requirements
  {
    collection: 'shift_position_requirements',
    action: 'read',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // READ own schedule_assignments
  {
    collection: 'schedule_assignments',
    action: 'read',
    permissions: {
      _and: [
        { employee_id: { _eq: '$CURRENT_USER.employee' } }
      ]
    },
    validation: null,
    fields: ['*']
  },
  
  // CREATE employee_availability
  {
    collection: 'employee_availability',
    action: 'create',
    permissions: {
      _and: [
        { employee_id: { _eq: '$CURRENT_USER.employee' } }
      ]
    },
    validation: {
      _and: [
        { employee_id: { _eq: '$CURRENT_USER.employee' } }
      ]
    },
    fields: ['*']
  },
  
  // READ own employee_availability
  {
    collection: 'employee_availability',
    action: 'read',
    permissions: {
      _and: [
        { employee_id: { _eq: '$CURRENT_USER.employee' } }
      ]
    },
    validation: null,
    fields: ['*']
  },
  
  // UPDATE own employee_availability
  {
    collection: 'employee_availability',
    action: 'update',
    permissions: {
      _and: [
        { employee_id: { _eq: '$CURRENT_USER.employee' } }
      ]
    },
    validation: null,
    fields: ['*']
  },
  
  // DELETE own employee_availability
  {
    collection: 'employee_availability',
    action: 'delete',
    permissions: {
      _and: [
        { employee_id: { _eq: '$CURRENT_USER.employee' } }
      ]
    },
    validation: null,
    fields: ['*']
  },
  
  // CREATE employee_availability_positions
  {
    collection: 'employee_availability_positions',
    action: 'create',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // READ employee_availability_positions
  {
    collection: 'employee_availability_positions',
    action: 'read',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // UPDATE employee_availability_positions
  {
    collection: 'employee_availability_positions',
    action: 'update',
    permissions: {},
    validation: null,
    fields: ['*']
  },
  
  // DELETE employee_availability_positions
  {
    collection: 'employee_availability_positions',
    action: 'delete',
    permissions: {},
    validation: null,
    fields: ['*']
  },
];

async function setupPermissions() {
  console.log('🔐 ═══════════════════════════════════════════════════════════════');
  console.log('🔐 SETUP EMPLOYEE PERMISSIONS');
  console.log('🔐 ═══════════════════════════════════════════════════════════════\n');
  
  try {
    const token = await getAuthToken();
    
    // 1. Get Employee Policy ID
    console.log('📜 Finding Employee Policy...');
    const policiesResponse = await fetch(`${directusUrl}/policies?filter[name][_eq]=Employee`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!policiesResponse.ok) {
      throw new Error(`Failed to fetch policies: ${await policiesResponse.text()}`);
    }
    
    const policiesData = await policiesResponse.json();
    const employeePolicy = policiesData.data?.[0];
    
    if (!employeePolicy) {
      throw new Error('Employee Policy not found! Please run seed script first.');
    }
    
    console.log(`✅ Found Employee Policy: ${employeePolicy.id}`);
    
    // 2. Get existing permissions for this policy
    console.log('\n📋 Fetching existing permissions...');
    const existingPermsResponse = await fetch(`${directusUrl}/permissions?filter[policy][_eq]=${employeePolicy.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!existingPermsResponse.ok) {
      throw new Error(`Failed to fetch permissions: ${await existingPermsResponse.text()}`);
    }
    
    const existingPermsData = await existingPermsResponse.json();
    const existingPerms = existingPermsData.data || [];
    
    console.log(`📊 Found ${existingPerms.length} existing permissions`);
    
    // 3. Create missing permissions
    console.log('\n🔧 Creating/Updating permissions...\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const perm of EMPLOYEE_PERMISSIONS) {
      const existing = existingPerms.find((p: any) => 
        p.collection === perm.collection && p.action === perm.action
      );
      
      if (existing) {
        // Update existing permission
        const updateResponse = await fetch(`${directusUrl}/permissions/${existing.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permissions: perm.permissions,
            validation: perm.validation,
            fields: perm.fields,
          }),
        });
        
        if (updateResponse.ok) {
          console.log(`   ✅ Updated: ${perm.action} ${perm.collection}`);
          updated++;
        } else {
          console.log(`   ⚠️ Failed to update: ${perm.action} ${perm.collection}`);
        }
      } else {
        // Create new permission
        const createResponse = await fetch(`${directusUrl}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            policy: employeePolicy.id,
            collection: perm.collection,
            action: perm.action,
            permissions: perm.permissions,
            validation: perm.validation,
            fields: perm.fields,
          }),
        });
        
        if (createResponse.ok) {
          console.log(`   ✅ Created: ${perm.action} ${perm.collection}`);
          created++;
        } else {
          const errorText = await createResponse.text();
          console.log(`   ⚠️ Failed to create: ${perm.action} ${perm.collection}`);
          console.log(`      Error: ${errorText}`);
        }
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`
    ✅ Created:  ${created}
    ✅ Updated:  ${updated}
    ⏭️  Skipped:  ${skipped}
    ─────────────────────────────────────────────────────────────────
    TOTAL:       ${created + updated + skipped}
    `);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('🎉 Employee Policy now has permissions to access employees collection!');
    console.log('🚀 Please restart backend server and test /api/users/me again.\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

setupPermissions().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
