import { faker } from '@faker-js/faker';
import { LOCATION_NAMES } from './book-location.seeder';

import type { PrismaClient } from '@/generated/prisma/client';

function generateTitle(i: number) {
	if (i % 5 === 0) return `Code ${faker.lorem.words(2)}`;
	if (i % 3 === 0) return `Programming ${faker.lorem.words(2)}`;
	return faker.lorem.words(3);
}

function pickCategory(): string {
	const rand = Math.random();

	if (rand < 0.4) return 'Programming';
	if (rand < 0.8) return 'Computer';
	return 'Software';
}

function pickLocation(): string {
	return LOCATION_NAMES[Math.floor(Math.random() * LOCATION_NAMES.length)];
}

export async function bookSeeder(
	prisma: PrismaClient,
	categoryMap: Record<string, number>,
	locationMap: Record<string, number>,
	total: number,
): Promise<void> {
	console.log('Seeding books...');

	const batchSize = 1000;

	for (let i = 0; i < total; i += batchSize) {
		const batch = [];

		for (let j = 0; j < batchSize && i + j < total; j++) {
			const index = i + j;

			const categoryName = pickCategory();
			const locationName = pickLocation();

			batch.push({
				title: generateTitle(index),
				author: faker.person.fullName(),
				year: faker.number.int({ min: 1980, max: 2024 }),
				publisher: faker.company.name(),
				description: faker.lorem.paragraph(),
				bookCategoryId: categoryMap[categoryName],
				bookLocationId: locationMap[locationName],
			});
		}

		await prisma.book.createMany({
			data: batch,
		});

		console.log(`Inserted ${i + batch.length} / ${total}`);
	}

	console.log('Books seeded');
}
