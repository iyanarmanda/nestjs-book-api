import type { PrismaClient } from '@/generated/prisma/client';

export const CATEGORY_NAMES = ['Programming', 'Computer', 'Software'];

export async function bookCategorySeeder(prisma: PrismaClient) {
	console.log('Seeding book categories...');

	const map: Record<string, number> = {};

	for (const name of CATEGORY_NAMES) {
		const category = await prisma.bookCategory.create({
			data: { name },
		});

		map[name] = category.id;
	}

	console.log('Book categories seeded');
	return map;
}
