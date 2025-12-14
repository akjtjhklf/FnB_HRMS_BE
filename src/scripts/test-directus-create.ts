// Test script to verify Directus create functionality
import { adminDirectus as directus } from '../utils/directusClient';
import { readItems, createItem } from '@directus/sdk';

async function testDirectusCreate() {
    console.log('🧪 Testing Directus create functionality...\n');

    const directusUrl = process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    if (!directusUrl || !directusToken) {
        console.error('❌ DIRECTUS_URL or DIRECTUS_TOKEN not set');
        return;
    }

    console.log('📍 Directus URL:', directusUrl);
    console.log('🔑 Token:', directusToken.substring(0, 10) + '...');

    // 1. Count existing records
    console.log('\n� Step 1: Count existing records...');
    const existingItems = await directus.request(readItems('employee_availability' as any));
    console.log(`   Found ${existingItems.length} existing records`);

    // 2. Try creating via SDK
    console.log('\n📊 Step 2: Create via SDK...');
    const testData = {
        employee_id: '588888e6-d2dd-11f0-915d-d6353c6b8f94',
        shift_id: `test-sdk-${Date.now()}`,
        status: 'available'
    };
    console.log('   Data:', JSON.stringify(testData, null, 2));

    try {
        const sdkResult = await directus.request((createItem as any)('employee_availability', testData));
        console.log('   SDK Result:', JSON.stringify(sdkResult, null, 2));
    } catch (err: any) {
        console.error('   SDK Error:', err.message);
    }

    // 3. Try creating via raw HTTP
    console.log('\n� Step 3: Create via raw HTTP...');
    const httpData = {
        employee_id: '588888e6-d2dd-11f0-915d-d6353c6b8f94',
        shift_id: `test-http-${Date.now()}`,
        status: 'available'
    };
    console.log('   Data:', JSON.stringify(httpData, null, 2));

    try {
        const response = await fetch(`${directusUrl}/items/employee_availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`,
            },
            body: JSON.stringify(httpData),
        });

        console.log('   HTTP Status:', response.status);
        const result = await response.json();
        console.log('   HTTP Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('   HTTP Error:', err.message);
    }

    // 4. Count records again
    console.log('\n📊 Step 4: Count records after creates...');
    const afterItems = await directus.request(readItems('employee_availability' as any));
    console.log(`   Found ${afterItems.length} records (was ${existingItems.length})`);
    console.log(`   New records created: ${afterItems.length - existingItems.length}`);

    // 5. Check for our test records
    console.log('\n� Step 5: Search for test records...');
    const testRecords = afterItems.filter((item: any) =>
        item.shift_id?.startsWith('test-sdk-') || item.shift_id?.startsWith('test-http-')
    );
    console.log(`   Found ${testRecords.length} test records:`);
    testRecords.forEach((r: any) => {
        console.log(`   - ID: ${r.id}, shift_id: ${r.shift_id}, created_at: ${r.created_at}`);
    });
}

testDirectusCreate().catch(console.error);
