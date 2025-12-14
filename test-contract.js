const { createDirectus, rest, authentication, createItem, readFieldsByCollection } = require('@directus/sdk');
require('dotenv').config();

async function testCreate() {
  const directus = createDirectus(process.env.DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());
  
  await directus.login({
    email: process.env.DIRECTUS_EMAIL,
    password: process.env.DIRECTUS_PASSWORD
  });
  
  console.log('✅ Logged in!');
  
  // Check field config first
  console.log('\n📋 Checking salary_scheme_id field config...');
  const fields = await directus.request(readFieldsByCollection('contracts'));
  const salarySchemeField = fields.find(f => f.field === 'salary_scheme_id');
  console.log('Field config:', JSON.stringify(salarySchemeField, null, 2));
  
  // Test create
  const testData = {
    employee_id: 'bd1ced8f-ce0f-11f0-9a6b-be8d80972d88',
    contract_type: 'full_time',
    base_salary: 1500000,
    salary_scheme_id: '283fbcab-cec1-11f0-8334-faa69948d887',
    start_date: '2025-12-01',
    is_active: true
  };
  
  console.log('\n📝 Sending data:', JSON.stringify(testData, null, 2));
  
  try {
    const result = await directus.request(createItem('contracts', testData));
    console.log('\n✅ Result:', JSON.stringify(result, null, 2));
    console.log('\n🔍 salary_scheme_id in result:', result.salary_scheme_id);
  } catch(err) {
    console.error('\n❌ Error:', err.errors || err.message || err);
  }
}

testCreate();
