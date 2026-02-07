
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Fix for relative paths in SQLite
const dbUrl = process.env.DATABASE_URL;
console.log('Current working directory:', process.cwd());
console.log('DATABASE_URL:', dbUrl);

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected successfully.');

        // Test query
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        const settings = await prisma.settings.findFirst();
        console.log('Settings found:', !!settings);

    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
