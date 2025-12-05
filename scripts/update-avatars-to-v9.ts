/**
 * Script để cập nhật tất cả avatar từ DiceBear v7 sang v9 với style pixel-art
 * Chạy: npx ts-node scripts/update-avatars-to-v9.ts
 */

import { directus as DirectusClient } from '../src/utils/directusClient';
import { readItems, updateItem } from '@directus/sdk';

const generateAvatarUrl = (firstName: string, lastName: string): string => {
  const seed = `${firstName} ${lastName}`.trim();
  return `https://api.dicebear.com/9.x/pixel-art/200/${encodeURIComponent(seed)}.svg`;
};

async function updateAvatars() {
  try {
    console.log('🚀 Bắt đầu cập nhật avatar cho tất cả nhân viên...');

    // Lấy tất cả nhân viên
    const employees = await DirectusClient.request(
      readItems('employees' as any, {
        fields: ['id', 'first_name', 'last_name', 'photo_url'],
        limit: -1,
      })
    );

    console.log(`📋 Tìm thấy ${employees.length} nhân viên`);

    let updated = 0;
    let skipped = 0;

    for (const employee of employees) {
      const firstName = employee.first_name || '';
      const lastName = employee.last_name || '';

      if (!firstName && !lastName) {
        console.log(`⏭️  Bỏ qua nhân viên ${employee.id} (không có tên)`);
        skipped++;
        continue;
      }

      const newAvatarUrl = generateAvatarUrl(firstName, lastName);

      // Chỉ cập nhật nếu URL khác
      if (employee.photo_url !== newAvatarUrl) {
        try {
          await DirectusClient.request(
            updateItem('employees' as any, employee.id, {
              photo_url: newAvatarUrl,
            })
          );
          console.log(`✅ ${firstName} ${lastName}: ${newAvatarUrl}`);
          updated++;
        } catch (error) {
          console.error(`❌ Lỗi cập nhật nhân viên ${employee.id}:`, error);
        }
      } else {
        console.log(`ℹ️  ${firstName} ${lastName}: URL đã đúng`);
        skipped++;
      }
    }

    console.log(`\n✨ Hoàn thành!`);
    console.log(`📊 Cập nhật: ${updated}`);
    console.log(`⏭️  Bỏ qua: ${skipped}`);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

updateAvatars();
