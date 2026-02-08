#!/bin/bash

echo "🔧 Fixing build errors..."

# Fix all API routes - replace getServerSession with getSession
echo "📝 Fixing auth imports in API routes..."

find src/app/api -name "*.ts" -type f -exec sed -i "s/import { getServerSession } from 'next-auth';/\/\/ Auth using custom JWT session/g" {} \;
find src/app/api -name "*.ts" -type f -exec sed -i "s/import { authOptions } from '@\/lib\/auth';/import { getSession } from '@\/lib\/auth';/g" {} \;
find src/app/api -name "*.ts" -type f -exec sed -i "s/const session = await getServerSession(authOptions);/const session = await getSession();/g" {} \;

echo "✅ Auth imports fixed!"
echo "🎨 Please manually create Checkbox component or we'll remove it from frontend..."
