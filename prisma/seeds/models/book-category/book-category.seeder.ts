import type { PrismaClient } from '@/generated/prisma/client';
import type { BookCategoryData } from '@/bootstraps/seed/data/interfaces/book-category.interface';

export async function bookCategorySeeder(
	prisma: PrismaClient,
	data: BookCategoryData[],
): Promise<void> {
	await prisma.bookCategory.createMany({
		data,
		skipDuplicates: true,
	});

	return;
}
