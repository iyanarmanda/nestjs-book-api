import { PrismaClient } from '@/generated/prisma/client';

export async function trucateDatabase(prisma: PrismaClient): Promise<void> {
	await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Book",
      "BookCategory",
      "BookLocation",
      "Admin"
    RESTART IDENTITY CASCADE  
  `);

	return;
}
