import 'dotenv/config';
import { directus } from './utils/directusClient';

async function run() {
  // @ts-expect-error dynamic SDK
  const users = directus.items('users');
  // @ts-expect-error dynamic SDK
  const employees = directus.items('employees');
  // @ts-expect-error dynamic SDK
  const devices = directus.items('devices');

  const user = await users.createOne({ email: 'admin@example.com', password_hash: 'hashed', is_active: 1 });
  const emp = await employees.createOne({ employee_code: 'EMP001', full_name: 'Admin User', email: 'admin@example.com', user_id: user.id });
  await devices.createOne({ name: 'RFID Gate 1', device_key: 'device-key-1', status: 'online', current_mode: 'attendance' });

  // eslint-disable-next-line no-console
  console.log('Seed completed:', { user, emp });
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

