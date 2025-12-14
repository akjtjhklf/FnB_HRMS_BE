/**
 * Test Notification Script
 * 
 * Usage: npx ts-node scripts/test-notification.ts
 * 
 * Prerequisites:
 * 1. Set NOVU_API_KEY in .env
 * 2. Create workflow "in-app-notification" on Novu Dashboard
 * 3. Have at least one employee in database
 */

import dotenv from 'dotenv';
dotenv.config();

import { getNotificationHelper, NotificationType } from '../src/modules/notifications';
import { EmployeeRepository } from '../src/modules/employees/employee.repository';

async function testNotifications() {
  console.log('🔔 Testing Notification System\n');

  // Check env
  if (!process.env.NOVU_API_KEY) {
    console.error('❌ NOVU_API_KEY is not set in .env');
    process.exit(1);
  }

  console.log('✅ NOVU_API_KEY is configured');
  console.log(`📍 NOVU_API_URL: ${process.env.NOVU_API_URL || 'https://api.novu.co (default)'}\n`);

  const helper = getNotificationHelper();
  const employeeRepo = new EmployeeRepository();

  // Get first employee for testing
  const employees = await employeeRepo.findAll({ limit: 1 });
  
  if (employees.length === 0) {
    console.error('❌ No employees found in database. Please seed data first.');
    process.exit(1);
  }

  const testEmployee = employees[0];
  console.log(`📋 Test Employee: ${testEmployee.full_name} (ID: ${testEmployee.id})\n`);

  // Test 1: Simple notification to employee
  console.log('📤 Test 1: Sending simple notification...');
  try {
    await helper.notifyEmployee(testEmployee.id, {
      title: '🧪 Test Notification',
      message: 'Đây là notification test từ HRMS system.',
      type: NotificationType.SYSTEM,
      actionUrl: '/dashboard',
    });
    console.log('✅ Test 1 passed!\n');
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error.message);
    if (error.message.includes('workflow')) {
      console.log('\n⚠️ Hint: Make sure you created "in-app-notification" workflow on Novu Dashboard');
    }
  }

  // Test 2: Payslip notification
  console.log('📤 Test 2: Sending payslip notification...');
  try {
    await helper.notifyPayslipReady(testEmployee.id, {
      month: 12,
      year: 2024,
      payslipId: 'test-payroll-id'
    });
    console.log('✅ Test 2 passed!\n');
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Salary request notification (to managers)
  console.log('📤 Test 3: Sending salary increase request notification...');
  try {
    await helper.notifySalaryIncreaseRequest(
      testEmployee.id,
      testEmployee.full_name || 'Test Employee',
      'test-request-id',
      testEmployee.department_id ?? undefined
    );
    console.log('✅ Test 3 passed!\n');
  } catch (error: any) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test 4: Salary request result notification
  console.log('📤 Test 4: Sending salary request approved notification...');
  try {
    await helper.notifySalaryRequestResult(
      testEmployee.id,
      true, // approved
      'test-request-id'
    );
    console.log('✅ Test 4 passed!\n');
  } catch (error: any) {
    console.error('❌ Test 4 failed:', error.message);
  }

  // Test 5: Schedule update notification
  console.log('📤 Test 5: Sending schedule update notification...');
  try {
    await helper.notifyScheduleUpdate(
      testEmployee.id,
      '2024-12-09'
    );
    console.log('✅ Test 5 passed!\n');
  } catch (error: any) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('🎉 All tests completed!');
  console.log('\n📱 Check your Novu Dashboard → Activity Feed to see sent notifications');
  console.log('👀 Or check the FE app notification inbox');
}

testNotifications()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
