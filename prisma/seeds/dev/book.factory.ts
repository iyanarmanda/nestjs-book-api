import { faker } from '@faker-js/faker';
import { bookCategoryData } from '@/database/seeds/data/book-category.data';
import { bookLocationData } from '@/database/seeds/data/book-location.data';

import type { BookData } from '@/database/seeds/data/interfaces/book.interface';

function randomNullable<T>(fn: () => T, probability = 0.7): T | null {
	return Math.random() < probability ? fn() : null;
}

export const bookFactory: BookData[] = Array.from({ length: 50 }, () => {
	const category = faker.helpers.arrayElement(bookCategoryData);
	const location = faker.helpers.arrayElement(bookLocationData);

	return {
		title: faker.lorem.words({ min: 2, max: 5 }),
		author: faker.person.fullName(),
		year: faker.number.int({ min: 1980, max: 2025 }),
		publisher: randomNullable(() => faker.company.name()),
		description: randomNullable(() => faker.lorem.paragraph()),
		bookCategory: category,
		bookLocation: location,
	};
});
