#!/usr/bin/env python3
import os
import re

# Files to fix
files_to_fix = [
    'src/app/api/admin/error-reports/route.ts',
    'src/app/api/admin/error-reports/[id]/route.ts',
    'src/app/api/admin/product-lines/[id]/route.ts',
    'src/app/api/orders/[id]/bulk-report-error/route.ts',
    'src/app/api/orders/[id]/product-lines/route.ts',
    'src/app/api/orders/[id]/report-error/route.ts',
    'src/app/api/product-lines/[id]/toggle-error/route.ts',
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"⚠️  Skipping {file_path} (not found)")
        continue

    print(f"🔧 Fixing {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace imports
    content = re.sub(
        r"import { getServerSession } from 'next-auth';",
        "// Auth using custom JWT session",
        content
    )

    content = re.sub(
        r"import { authOptions } from '@/lib/auth';",
        "import { getSession } from '@/lib/auth';",
        content
    )

    # Replace usage
    content = re.sub(
        r"const session = await getServerSession\(authOptions\);",
        "const session = await getSession();",
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Fixed {file_path}")

print("\n✅ All files fixed!")
