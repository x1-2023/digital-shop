const fs = require('fs');
const path = require('path');

const adminPages = [
  'src/app/admin/products/page.tsx',
  'src/app/admin/orders/page.tsx',
  'src/app/admin/topups/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/wallets/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/website-settings/page.tsx',
];

adminPages.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove AdminSidebar import
  content = content.replace(
    /import { AdminSidebar } from '@\/components\/layout\/admin-sidebar';\n/,
    ''
  );

  // Replace <AppShell> with <AppShell isAdmin>
  content = content.replace(/<AppShell>/g, '<AppShell isAdmin>');

  // Remove <AdminSidebar /> lines
  content = content.replace(/<AdminSidebar \/>\n\s*/g, '');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed ${filePath}`);
});

console.log('✓ All admin pages fixed!');
