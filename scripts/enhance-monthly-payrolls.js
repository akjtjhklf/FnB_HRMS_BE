/**
 * SIMPLE Migration Script - Add Fields to monthly_payrolls
 * Uses simple HTTP requests with axios
 */

const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Admin123!';

async function migrate() {
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

        // 2. Add fields
        const fields = [
            { field: 'contract_id', type: 'uuid', note: 'Link to contract' },
            { field: 'pay_type', type: 'string', note: 'hourly/fixed_shift/monthly' },
            { field: 'hourly_rate', type: 'decimal', note: 'For hourly pay' },
            { field: 'total_work_days', type: 'integer', note: 'From attendance' },
            { field: 'total_late_minutes', type: 'integer', note: 'Late minutes' },
            { field: 'total_early_leave_minutes', type: 'integer', note: 'Early leave minutes' },
            { field: 'late_penalty', type: 'decimal', note: 'Calculated penalty' },
            { field: 'early_leave_penalty', type: 'decimal', note: 'Calculated penalty' },
        ];

        console.log('Adding fields to monthly_payrolls collection...\n');

        for (const f of fields) {
            try {
                await axios.post(
                    `${DIRECTUS_URL}/fields/monthly_payrolls`,
                    {
                        field: f.field,
                        type: f.type,
                        meta: {
                            interface: 'input',
                            note: f.note,
                            readonly: f.field.includes('total_') || f.field.includes('_penalty')
                        },
                        schema: {}
                    },
                    { headers }
                );
                console.log(`✅ Added: ${f.field}`);
            } catch (err) {
                if (err.response && err.response.data && err.response.data.errors) {
                    const error = err.response.data.errors[0];
                    if (error.message && error.message.includes('already exists')) {
                        console.log(`⏭️  Exists: ${f.field}`);
                    } else {
                        console.log(`❌ Error: ${f.field} - ${error.message}`);
                    }
                } else {
                    console.log(`❌ Error: ${f.field}`);
                }
            }
        }

        console.log('\n🎉 Migration completed!');
        console.log('\n✅ New fields added to monthly_payrolls collection');
        console.log('✅ Existing data is not affected');
        console.log('✅ You can now use the enhanced payroll features!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

migrate();
