const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';

    console.log(`Creating admin user: ${email}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: 'ADMIN',
                password: hashedPassword,
            },
            create: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        console.log('Admin user created/updated successfully!');
        console.log('Email:', user.email);
        console.log('Password:', password);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
