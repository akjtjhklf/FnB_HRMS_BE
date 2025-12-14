
import { createDirectus, authentication, rest, createItem, readItems, updateItem } from "@directus/sdk";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import dotenv from "dotenv";

dotenv.config();

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "Admin123!";

const client = createDirectus(DIRECTUS_URL)
  .with(authentication("json", { autoRefresh: true }))
  .with(rest());

async function simulateSalaryFlow() {
  console.log("🚀 Starting Salary Flow Simulation...");

  try {
    // Login
    console.log("Logging in...");
    await client.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    console.log("✅ Logged in successfully");
    // 1. Create a Salary Scheme
    console.log("\n1. Creating Salary Scheme...");
    const schemeId = uuidv4();
    const scheme = await client.request(
      createItem("salary_schemes", {
        id: schemeId,
        name: `Test Scheme ${new Date().getTime()}`,
        pay_type: "monthly",
        rate: 15000000, // 15 million
        is_active: true,
      })
    );
    console.log("✅ Salary Scheme Created:", scheme.name);

    // 2. Create an Employee
    console.log("\n2. Creating Employee...");
    const employeeId = uuidv4();
    const employee = await client.request(
      createItem("employees", {
        id: employeeId,
        first_name: "Test",
        last_name: "Employee",
        email: `test.employee.${new Date().getTime()}@example.com`,
        status: "active",
      })
    );
    console.log("✅ Employee Created:", employee.first_name);

    // 3. Create a Contract linked to the Scheme
    console.log("\n3. Creating Contract linked to Scheme...");
    const contractId = uuidv4();
    const contract = await client.request(
      createItem("contracts", {
        id: contractId,
        employee_id: employeeId,
        contract_type: "full_time",
        start_date: "2024-01-01",
        status: "active",
        salary_scheme_id: schemeId,
        // base_salary is optional, let's leave it empty to test fallback
      })
    );
    console.log("✅ Contract Created linked to Scheme:", contract.salary_scheme_id);

    // 4. Generate Payroll
    console.log("\n4. Triggering Payroll Generation via API...");
    // We need to use fetch or axios to call the backend API
    // Get the token from the client
    const token = await client.getToken();
    
    const response = await fetch(`${DIRECTUS_URL}/monthly-payrolls/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            month: "2024-10" // Generate for a specific month
        })
    });

    if (response.ok) {
        console.log("✅ Payroll Generation Triggered Successfully");
        
        // 5. Verify Payroll Data
        console.log("\n5. Verifying Payroll Data...");
        // Wait a bit for async processing if any
        await new Promise(resolve => setTimeout(resolve, 2000));

        const payrolls = await client.request(
            readItems("monthly_payrolls", {
                filter: {
                    employee_id: { _eq: employeeId },
                    month: { _eq: "2024-10" }
                }
            })
        );

        if (payrolls.length > 0) {
            const payroll = payrolls[0];
            console.log("Payroll Found:", payroll);
            
            if (Number(payroll.base_salary) === 15000000) {
                console.log("✅ SUCCESS: Base Salary matches Scheme Rate (15,000,000)");
            } else {
                console.error("❌ FAILURE: Base Salary mismatch. Expected 15,000,000, got", payroll.base_salary);
            }

            if (payroll.salary_scheme_id === schemeId) {
                console.log("✅ SUCCESS: Payroll linked to correct Salary Scheme");
            } else {
                console.error("❌ FAILURE: Payroll linked to wrong Scheme. Expected", schemeId, "got", payroll.salary_scheme_id);
            }

        } else {
            console.error("❌ FAILURE: No payroll generated for the employee.");
        }

    } else {
        const errorText = await response.text();
        console.error("❌ Failed to trigger payroll generation:", response.status, errorText);
    }

  } catch (error: any) {
    console.error("❌ Simulation Failed:", error);
    if (error.stack) {
        console.error(error.stack);
    }
  }
}

simulateSalaryFlow();
