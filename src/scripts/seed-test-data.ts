import { createDirectus, rest, authentication, createItem, readItems } from '@directus/sdk';
import 'dotenv/config';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';

const client = createDirectus(DIRECTUS_URL)
  .with(authentication())
  .with(rest());

async function seedData() {
  try {
    console.log('🔐 Logging in...');
    // Correctly passing an object as expected by the SDK
    await client.login({ email: 'admin@example.com', password: 'Admin123!' });
    console.log('✅ Logged in successfully');

    console.log('🌱 Starting data seeding...');

    // 1. Get or Create Position
    console.log('Checking Position...');
    const existingPositions: any[] = await client.request(readItems('positions', {
      filter: { name: { _eq: 'Senior Barista' } },
      limit: 1
    }));

    let positionId;
    if (existingPositions.length > 0) {
      console.log('✅ Position already exists:', existingPositions[0].id);
      positionId = existingPositions[0].id;
    } else {
      console.log('Creating Position...');
      const position = await client.request(createItem('positions', {
        name: 'Senior Barista',
        description: 'Experienced coffee maker',
        department: 'F&B',
        level: 'Senior'
      }));
      console.log('✅ Position created:', position.id);
      positionId = position.id;
    }

    // 2. Get or Create Salary Scheme
    console.log('Checking Salary Scheme...');
    const existingSchemes: any[] = await client.request(readItems('salary_schemes', {
      filter: { name: { _eq: 'Senior Barista Scheme' } },
      limit: 1
    }));

    let schemeId;
    if (existingSchemes.length > 0) {
      console.log('✅ Salary Scheme already exists:', existingSchemes[0].id);
      schemeId = existingSchemes[0].id;
    } else {
      console.log('Creating Salary Scheme...');
      const scheme = await client.request(createItem('salary_schemes', {
        name: 'Senior Barista Scheme',
        position_id: positionId,
        pay_type: 'hourly',
        rate: 85000,
        min_hours: 160,
        is_active: true
      }));
      console.log('✅ Salary Scheme created:', scheme.id);
      schemeId = scheme.id;
    }

    // 3. Create Employee
    console.log('Creating Employee...');
    let employee;
    try {
      employee = await client.request(createItem('employees', {
        first_name: 'Test',
        last_name: 'Employee',
        email: `test.employee.${Date.now()}@example.com`,
        employee_code: `EMP${Date.now()}`,
        status: 'active',
        position_id: positionId,
        scheme_id: schemeId,
        hire_date: '2024-01-01',
        phone: '0909000111'
      }));
      console.log('✅ Employee created:', employee.id);
    } catch (e) {
      console.error('❌ Failed to create employee:', JSON.stringify(e, null, 2));
      throw e;
    }

    // 4. Create Monthly Payrolls (Past 3 months)
    console.log('Creating Monthly Payrolls...');
    const months = ['2024-08', '2024-09', '2024-10'];
    
    for (const month of months) {
      try {
        await client.request(createItem('monthly_payrolls', {
          employee_id: employee.id,
          month: month,
          salary_scheme_id: schemeId,
          base_salary: 85000,
          total_work_hours: 176,
          bonuses: month === '2024-09' ? 500000 : 0,
          penalties: month === '2024-10' ? 200000 : 0,
          notes: month === '2024-09' ? 'Thưởng doanh số' : (month === '2024-10' ? 'Đi muộn 3 lần' : null),
          status: 'paid',
          gross_salary: 15000000,
          net_salary: 14500000
        }));
        console.log(`✅ Monthly Payroll created for ${month}`);
      } catch (e) {
        console.error(`❌ Failed to create payroll for ${month}:`, JSON.stringify(e, null, 2));
      }
    }
    console.log('✅ Monthly Payrolls created');

    // 5. Create Schedule Assignments (Current month)
    console.log('Creating Schedule Assignments...');
    // Create 5 shifts
    for (let i = 1; i <= 5; i++) {
       try {
         await client.request(createItem('schedule_assignments', {
          employee_id: employee.id,
          position_id: positionId,
          date: `2024-11-0${i}`,
          start_time: '08:00:00',
          end_time: '17:00:00',
          status: 'assigned',
          shift_type_id: null // Optional
        }));
        console.log(`✅ Shift created for 2024-11-0${i}`);
       } catch (e) {
         console.error(`❌ Failed to create shift for 2024-11-0${i}:`, JSON.stringify(e, null, 2));
       }
    }
    console.log('✅ Schedule Assignments created');

    console.log('🎉 Seeding completed successfully!');
    console.log(`👉 Check Employee ID: ${employee.id}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seedData();
