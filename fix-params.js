const fs = require('fs');
const path = require('path');

const filesToFix = [
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
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return;
  }

  console.log(`🔧 Fixing ${filePath}`);

  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix GET method params
  content = content.replace(
    /export async function GET\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ id: string \} \}\s*\)/g,
    'export async function GET(\n  request: NextRequest,\n  { params }: { params: Promise<{ id: string }> }\n)'
  );

  // Fix POST method params
  content = content.replace(
    /export async function POST\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ id: string \} \}\s*\)/g,
    'export async function POST(\n  request: NextRequest,\n  { params }: { params: Promise<{ id: string }> }\n)'
  );

  // Fix PATCH method params
  content = content.replace(
    /export async function PATCH\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ id: string \} \}\s*\)/g,
    'export async function PATCH(\n  request: NextRequest,\n  { params }: { params: Promise<{ id: string }> }\n)'
  );

  // Fix DELETE method params
  content = content.replace(
    /export async function DELETE\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ id: string \} \}\s*\)/g,
    'export async function DELETE(\n  request: NextRequest,\n  { params }: { params: Promise<{ id: string }> }\n)'
  );

  // Fix the destructuring of params - add await
  content = content.replace(
    /const \{ id \} = params;/g,
    'const { id } = await params;'
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Fixed ${filePath}`);
});

console.log('\n✅ All files fixed!');
