/**
 * Migration Script: Create Payrolls Collection in Directus
 * 
 * Run this script to automatically create the payrolls collection
 * with all necessary fields and relationships.
 * 
 * Usage:
 *   node scripts/create-payrolls-collection.js
 */

const { createDirectus, rest, staticToken } = require('@directus/sdk');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('❌ DIRECTUS_TOKEN environment variable is required');
    process.exit(1);
}

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

async function createPayrollsCollection() {
    try {
        console.log('🚀 Creating payrolls collection...');

        // Create the collection
        await client.request({
            method: 'POST',
            path: '/collections',
            body: {
                collection: 'payrolls',
                meta: {
                    icon: 'payments',
                    note: 'Employee payroll records',
                    display_template: '{{employee_id.first_name}} {{employee_id.last_name}} - {{month}}/{{year}}',
                },
                schema: {
                    name: 'payrolls',
                },
            },
        });

        console.log('✅ Collection created');

        // Create fields
        const fields = [
            // Employee relationship
            {
                collection: 'payrolls',
                field: 'employee_id',
                type: 'uuid',
                meta: {
                    interface: 'select-dropdown-m2o',
                    options: {
                        template: '{{first_name}} {{last_name}}',
                    },
                    display: 'related-values',
                    required: true,
                },
                schema: {
                    foreign_key_table: 'employees',
                    foreign_key_column: 'id',
                },
            },
            // Contract relationship
            {
                collection: 'payrolls',
                field: 'contract_id',
                type: 'uuid',
                meta: {
                    interface: 'select-dropdown-m2o',
                },
                schema: {
                    foreign_key_table: 'contracts',
                    foreign_key_column: 'id',
                },
            },
            // Period fields
            {
                collection: 'payrolls',
                field: 'month',
                type: 'integer',
                meta: {
                    interface: 'input',
                    required: true,
                    note: '1-12',
                },
            },
            {
                collection: 'payrolls',
                field: 'year',
                type: 'integer',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            // Salary inputs
            {
                collection: 'payrolls',
                field: 'base_salary',
                type: 'decimal',
                meta: {
                    interface: 'input',
                    note: 'From contract',
                },
            },
            {
                collection: 'payrolls',
                field: 'salary_scheme_id',
                type: 'uuid',
                meta: {
                    interface: 'select-dropdown-m2o',
                },
                schema: {
                    foreign_key_table: 'salary_schemes',
                    foreign_key_column: 'id',
                },
            },
            {
                collection: 'payrolls',
                field: 'pay_type',
                type: 'string',
                meta: {
                    interface: 'select-dropdown',
                    options: {
                        choices: [
                            { text: 'Hourly', value: 'hourly' },
                            { text: 'Fixed Shift', value: 'fixed_shift' },
                            { text: 'Monthly', value: 'monthly' },
                        ],
                    },
                },
            },
            {
                collection: 'payrolls',
                field: 'hourly_rate',
                type: 'decimal',
                meta: {
                    interface: 'input',
                },
            },
            // Attendance data
            {
                collection: 'payrolls',
                field: 'total_work_days',
                type: 'integer',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            {
                collection: 'payrolls',
                field: 'total_work_hours',
                type: 'decimal',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            {
                collection: 'payrolls',
                field: 'total_late_minutes',
                type: 'integer',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            {
                collection: 'payrolls',
                field: 'total_early_leave_minutes',
                type: 'integer',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            // Calculated amounts
            {
                collection: 'payrolls',
                field: 'gross_salary',
                type: 'decimal',
                meta: {
                    interface: 'input',
                    required: true,
                    note: 'Before deductions',
                },
            },
            {
                collection: 'payrolls',
                field: 'late_penalty',
                type: 'decimal',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            {
                collection: 'payrolls',
                field: 'early_leave_penalty',
                type: 'decimal',
                meta: {
                    interface: 'input',
                    required: true,
                },
            },
            {
                collection: 'payrolls',
                field: 'allowances',
                type: 'decimal',
                meta: {
                    interface: 'input',
                },
            },
            {
                collection: 'payrolls',
                field: 'bonus',
                type: 'decimal',
                meta: {
                    interface: 'input',
                },
            },
            {
                collection: 'payrolls',
                field: 'deductions',
                type: 'decimal',
                meta: {
                    interface: 'input',
                },
            },
            {
                collection: 'payrolls',
                field: 'net_salary',
                type: 'decimal',
                meta: {
                    interface: 'input',
                    required: true,
                    note: 'Final salary',
                },
            },
            // Metadata
            {
                collection: 'payrolls',
                field: 'status',
                type: 'string',
                meta: {
                    interface: 'select-dropdown',
                    options: {
                        choices: [
                            { text: 'Draft', value: 'draft' },
                            { text: 'Approved', value: 'approved' },
                            { text: 'Paid', value: 'paid' },
                        ],
                    },
                    required: true,
                    default_value: 'draft',
                },
            },
            {
                collection: 'payrolls',
                field: 'notes',
                type: 'text',
                meta: {
                    interface: 'input-multiline',
                },
            },
            {
                collection: 'payrolls',
                field: 'payment_date',
                type: 'timestamp',
                meta: {
                    interface: 'datetime',
                },
            },
            // Audit fields
            {
                collection: 'payrolls',
                field: 'approved_by',
                type: 'uuid',
                meta: {
                    interface: 'select-dropdown-m2o',
                },
                schema: {
                    foreign_key_table: 'directus_users',
                    foreign_key_column: 'id',
                },
            },
            {
                collection: 'payrolls',
                field: 'approved_at',
                type: 'timestamp',
                meta: {
                    interface: 'datetime',
                },
            },
        ];

        console.log('📝 Creating fields...');

        for (const field of fields) {
            try {
                await client.request({
                    method: 'POST',
                    path: '/fields/' + field.collection,
                    body: field,
                });
                console.log(`✅ Created field: ${field.field}`);
            } catch (error) {
                console.error(`❌ Failed to create field ${field.field}:`, error.message);
            }
        }

        console.log('\n🎉 Payrolls collection created successfully!');
        console.log('\n📌 Next steps:');
        console.log('1. Go to Directus admin panel');
        console.log('2. Set up permissions for the payrolls collection');
        console.log('3. Test the payroll module at /payroll');

    } catch (error) {
        console.error('❌ Error creating collection:', error);
        throw error;
    }
}

// Run the migration
createPayrollsCollection()
    .then(() => {
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
