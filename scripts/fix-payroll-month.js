/**
 * Fix: Delete December 2025 payroll and generate for November 2025
 */

const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Admin123!';

const WRONG_PAYROLL_ID = '5f7a6e5e-d0c4-46b7-8242-e988502a2181'; // December 2025

async function fixPayrollMonth() {
    try {
        // 1. Login
        console.log('🔐 Logging in...');
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Logged in!\n');

        // 2. Delete December 2025 payroll (wrong month)
        console.log('🗑️  Deleting December 2025 payroll (wrong month)...');
        try {
            await axios.delete(
                `${DIRECTUS_URL}/items/monthly_payrolls/${WRONG_PAYROLL_ID}`,
                { headers }
            );
            console.log('✅ Deleted!\n');
        } catch (err) {
            console.log('⏭️  Already deleted\n');
        }

        console.log('🎯 NOW GENERATE FOR NOVEMBER 2025:');
        console.log('1. Go to http://localhost:3000/salary');
        console.log('2. Click "Tính lương"');
        console.log('3. Select "Tháng 11/2025" ← IMPORTANT!');
        console.log('4. Click OK');
        console.log('\n✨ Expected result with FULL data:');
        console.log('   📅 Month: 2025-11 (has attendance data)');
        console.log('   💰 Base salary: ~1,076,923 VNĐ');
        console.log('   📊 Work days: 20 days');
        console.log('   ⏰ Work hours: 159.5 hours');
        console.log('   ⚠️  Late minutes: 0');
        console.log('   ⚠️  Early leave: 28 minutes');
        console.log('   💸 Late penalty: 0 VNĐ');
        console.log('   💸 Early penalty: ~4,667 VNĐ');
        console.log('   💵 Net salary: ~1,072,256 VNĐ');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

fixPayrollMonth();
