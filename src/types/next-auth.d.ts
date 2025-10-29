import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      createdAt?: Date;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    createdAt?: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
