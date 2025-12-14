/**
 * Fix Script: Update Contract with Salary Scheme
 */

const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Admin123!';

async function fixContractAndPayroll() {
    try {
        // 1. Login
        console.log('🔐 Logging in...');
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.data.access_token;
        console.log('✅ Logged in!\n');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Update contract with salary scheme
        console.log('📝 Updating contract...');
        await axios.patch(
            `${DIRECTUS_URL}/items/contracts/41edaef2-c1a2-11f0-b8d4-0ab1a9f7e9f2`,
            {
                salary_scheme_id: '283fbcab-cec1-11f0-8334-faa69948d887',
                base_salary: 1400000
            },
            { headers }
        );
        console.log('✅ Contract updated with salary scheme!');

        // 3. Delete old payroll records
        console.log('\n🗑️  Deleting old payroll records...');
        const payrollIds = [
            '5550e39d-0c40-49b0-84a9-17e980815c21', // 2025-12
            '6b81ce25-fa32-4a31-aeb7-fe18983df1ab'  // 2025-11
        ];

        for (const id of payrollIds) {
            try {
                await axios.delete(`${DIRECTUS_URL}/items/monthly_payrolls/${id}`, { headers });
                console.log(`  ✅ Deleted: ${id}`);
            } catch (err) {
                console.log(`  ⏭️  Already deleted or not found: ${id}`);
            }
        }

        console.log('\n🎉 Fix completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to http://localhost:3000/salary');
        console.log('2. Select month "Tháng 11/2025"');
        console.log('3. Click "Tính lương"');
        console.log('4. You should see base_salary = 1,400,000!');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

fixContractAndPayroll();
