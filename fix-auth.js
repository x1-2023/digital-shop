const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/admin/error-reports/route.ts',
  'src/app/api/admin/error-reports/[id]/route.ts',
  'src/app/api/admin/product-lines/[id]/route.ts',
  'src/app/api/orders/[id]/bulk-report-error/route.ts',
  'src/app/api/orders/[id]/product-lines/route.ts',
  'src/app/api/orders/[id]/report-error/route.ts',
  'src/app/api/product-lines/[id]/toggle-error/route.ts',
];

filesToFix.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} (not found)`);
    return;
  }

  console.log(`Fixing ${filePath}`);

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace imports
  content = content.replace(
    /import { getServerSession } from 'next-auth';/g,
    "// Auth using custom JWT session"
  );

  content = content.replace(
    /import { authOptions } from '@\/lib\/auth';/g,
    "import { getSession } from '@/lib/auth';"
  );

  // Replace usage
  content = content.replace(
    /const session = await getServerSession\(authOptions\);/g,
    "const session = await getSession();"
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
});

console.log('\nAll files fixed!');
