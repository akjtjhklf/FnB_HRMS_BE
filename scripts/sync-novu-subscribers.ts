/**
 * Sync Employees to Novu Subscribers
 * 
 * This script:
 * 1. Creates subscribers in Novu for all active employees
 * 2. Creates the "all-employees" topic
 * 3. Adds all employees to the topic
 * 
 * Usage: npx ts-node scripts/sync-novu-subscribers.ts
 * 
 * Run this script:
 * - Once during initial setup
 * - When new employees are added (or automate via webhook)
 */

import dotenv from 'dotenv';
dotenv.config();

import { Novu } from '@novu/node';
import { EmployeeRepository } from '../src/modules/employees/employee.repository';

const TOPIC_KEY = 'all-employees';
const TOPIC_NAME = 'All Employees';

async function syncSubscribers() {
  console.log('🔄 Syncing Employees to Novu Subscribers\n');

  // Check env
  if (!process.env.NOVU_API_KEY) {
    console.error('❌ NOVU_API_KEY is not set in .env');
    process.exit(1);
  }

  const novu = new Novu(process.env.NOVU_API_KEY);
  const employeeRepo = new EmployeeRepository();

  // Get all active employees
  console.log('📋 Fetching employees from database...');
  const employees = await employeeRepo.findAll({
    filter: {
      status: { _eq: 'active' }
    },
    fields: ['id', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'photo_url']
  });

  console.log(`Found ${employees.length} active employees\n`);

  if (employees.length === 0) {
    console.log('⚠️ No employees found. Make sure to seed data first.');
    process.exit(0);
  }

  // Step 1: Create/Update subscribers
  console.log('👥 Creating/Updating subscribers in Novu...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const subscriberIds: string[] = [];

  for (const emp of employees) {
    try {
      await novu.subscribers.identify(emp.id, {
        email: emp.email || undefined,
        firstName: emp.first_name || emp.full_name?.split(' ')[0] || undefined,
        lastName: emp.last_name || emp.full_name?.split(' ').slice(1).join(' ') || undefined,
        phone: emp.phone || undefined,
        avatar: emp.photo_url || undefined,
        data: {
          employeeId: emp.id,
          fullName: emp.full_name || '',
        }
      });

      subscriberIds.push(emp.id);
      successCount++;
      console.log(`  ✅ ${emp.full_name || emp.id}`);
    } catch (error: any) {
      errorCount++;
      console.log(`  ❌ ${emp.full_name || emp.id}: ${error?.message}`);
    }
  }

  console.log(`\n📊 Subscribers: ${successCount} success, ${errorCount} failed\n`);

  // Step 2: Create topic
  console.log('📌 Creating topic "all-employees"...');
  try {
    await novu.topics.create({
      key: TOPIC_KEY,
      name: TOPIC_NAME,
    });
    console.log('  ✅ Topic created\n');
  } catch (error: any) {
    if (error?.message?.includes('already exists') || error?.response?.status === 409) {
      console.log('  ℹ️ Topic already exists\n');
    } else {
      console.log(`  ❌ Failed to create topic: ${error?.message}\n`);
    }
  }

  // Step 3: Add subscribers to topic
  if (subscriberIds.length > 0) {
    console.log(`📌 Adding ${subscriberIds.length} subscribers to topic...`);
    try {
      // Novu has a limit per request, so we batch
      const batchSize = 100;
      for (let i = 0; i < subscriberIds.length; i += batchSize) {
        const batch = subscriberIds.slice(i, i + batchSize);
        await novu.topics.addSubscribers(TOPIC_KEY, {
          subscribers: batch,
        });
        console.log(`  ✅ Added batch ${Math.floor(i / batchSize) + 1} (${batch.length} subscribers)`);
      }
      console.log('');
    } catch (error: any) {
      console.log(`  ❌ Failed to add subscribers to topic: ${error?.message}\n`);
    }
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total employees:     ${employees.length}`);
  console.log(`Subscribers synced:  ${successCount}`);
  console.log(`Failed:              ${errorCount}`);
  console.log(`Topic:               ${TOPIC_KEY}`);
  console.log('═'.repeat(50));
  
  console.log('\n✅ Sync completed!');
  console.log('\n💡 Tips:');
  console.log('  - Run this script whenever new employees are added');
  console.log('  - Or call the sync API: POST /api/notifications/sync-subscribers');
  console.log('  - Check Novu Dashboard → Subscribers to verify');
}

syncSubscribers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
