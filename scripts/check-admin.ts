
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: {
            role: 'ADMIN',
        },
    });

    if (admins.length > 0) {
        console.log('✅ Found admin accounts:');
        admins.forEach((admin) => {
            console.log(`- Email: ${admin.email}, ID: ${admin.id}, Name: ${admin.name}`);
        });
    } else {
        console.log('❌ No admin accounts found.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
