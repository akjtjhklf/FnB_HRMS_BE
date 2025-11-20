/**
 * Test Cascade Delete Utility
 * 
 * Uncomment và chạy để test cascade delete
 */

import { cascadeDelete, getDependentTables } from './cascade-delete.utils';

async function testCascadeDelete() {
  console.log('\n=== Testing Cascade Delete Utility ===\n');

  // Test 1: Get dependent tables
  console.log('📋 Positions dependent tables:');
  const positionDeps = getDependentTables('positions');
  console.log(positionDeps);

  console.log('\n📋 Employees dependent tables:');
  const employeeDeps = getDependentTables('employees');
  console.log(employeeDeps);

  console.log('\n📋 Shifts dependent tables:');
  const shiftDeps = getDependentTables('shifts');
  console.log(shiftDeps);

  // Test 2: Actual cascade delete (uncomment to test with real data)
  /*
  try {
    const result = await cascadeDelete('positions', 'test-position-id-here');
    console.log('\n✅ Cascade delete result:', result);
  } catch (error: any) {
    console.error('\n❌ Cascade delete failed:', error.message);
  }
  */
}

// Run test
// testCascadeDelete();

export { testCascadeDelete };
