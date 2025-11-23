/**
 * Test script to verify bulk create shifts response
 * Run: node test-bulk-response.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBulkCreate() {
  const shiftsToCreate = [];
  const startDate = '2025-12-01';
  const scheduleId = '0a056e41-c638-11f0-a69c-7ae3c7595f10';
  const shiftTypeId = 'cab61656-c62a-11f0-a69c-7ae3c7595f10';

  // Generate 7 shifts
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    shiftsToCreate.push({
      schedule_id: scheduleId,
      shift_type_id: shiftTypeId,
      shift_date: dateStr,
      start_at: '07:00:00',
      end_at: '12:00:00',
      total_required: 4,
      notes: `Test shift ${i + 1} - ${dateStr}`,
    });
  }

  console.log(`📤 Sending ${shiftsToCreate.length} shifts to bulk create...`);

  try {
    const response = await axios.post(`${API_BASE}/shifts/bulk`, {
      shifts: shiftsToCreate,
    });

    console.log('\n✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data structure:', {
      success: response.data.success,
      hasData: !!response.data.data,
      dataType: typeof response.data.data,
      hasTotal: 'total' in (response.data.data || {}),
      hasShifts: 'shifts' in (response.data.data || {}),
      shiftsLength: response.data.data?.shifts?.length || 0,
    });

    console.log('\n📊 Response.data.data:');
    console.log(JSON.stringify(response.data.data, null, 2));

    if (response.data.data?.shifts) {
      console.log(`\n✅ Shifts array has ${response.data.data.shifts.length} items`);
      console.log('First shift:', response.data.data.shifts[0]);
      console.log('Last shift:', response.data.data.shifts[response.data.data.shifts.length - 1]);
      
      // Check unique IDs
      const uniqueIds = new Set(response.data.data.shifts.map(s => s.id));
      console.log(`\n📋 Unique shift IDs: ${uniqueIds.size} (should be ${response.data.data.shifts.length})`);
      
      if (uniqueIds.size !== response.data.data.shifts.length) {
        console.error('❌ WARNING: Duplicate shift IDs detected!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBulkCreate();
