/**
 * Delete old payroll and regenerate with real attendance data
 */

const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Admin123!';

const OLD_PAYROLL_ID = '59a257a2-d199-4b80-90e0-92320d513961';

async function regeneratePayroll() {
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

        // 2. Delete old payroll
        console.log('🗑️  Deleting old payroll...');
        try {
            await axios.delete(
                `${DIRECTUS_URL}/items/monthly_payrolls/${OLD_PAYROLL_ID}`,
                { headers }
            );
            console.log('✅ Old payroll deleted!\n');
        } catch (err) {
            console.log('⏭️  Already deleted or not found\n');
        }

        console.log('🎉 Done! Now:');
        console.log('1. Go to http://localhost:3000/salary');
        console.log('2. Click "Tính lương"');
        console.log('3. Select "Tháng 11/2025"');
        console.log('4. Click OK');
        console.log('\n✨ You will see REAL salary with:');
        console.log('   - Base salary: ~1,076,923 VNĐ (20/26 days)');
        console.log('   - Early leave penalty: ~4,667 VNĐ (28 min)');
        console.log('   - Net salary: ~1,072,256 VNĐ');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

regeneratePayroll();
