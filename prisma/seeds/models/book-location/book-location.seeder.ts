import type { PrismaClient } from '@/generated/prisma/client';
import type { BookLocationData } from '@/database/seeds/data/interfaces/book-location.interface';

export async function bookLocationSeeder(
	prisma: PrismaClient,
	data: BookLocationData[],
): Promise<void> {
	await prisma.bookLocation.createMany({
		data,
		skipDuplicates: true,
	});

	return;
}
