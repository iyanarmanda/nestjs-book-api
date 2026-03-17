import type { PrismaClient } from '@/generated/prisma/client';

export const LOCATION_NAMES = ['A-01', 'A-02', 'B-01'];

export async function bookLocationSeeder(prisma: PrismaClient) {
	console.log('Seeding book locations...');

	const map: Record<string, number> = {};

	for (const name of LOCATION_NAMES) {
		const location = await prisma.bookLocation.create({
			data: { name },
		});

		map[name] = location.id;
	}

	console.log('Book locations seeded');

	return map;
}
