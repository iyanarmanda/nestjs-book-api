import { PrismaClient } from '@/generated/prisma/client';

import type { BookData } from '@/database/seeds/data/interfaces/book.interface';

export async function bookSeeder(prisma: PrismaClient, data: BookData[]): Promise<void> {
	for (const book of data) {
		await prisma.book.create({
			data: {
				title: book.title,
				author: book.author,
				year: book.year,
				publisher: book.publisher,
				description: book.description,
				bookCategory: {
					connect: {
						name: book.bookCategory.name,
					},
				},
				bookLocation: {
					connect: {
						name: book.bookLocation.name,
					},
				},
			},
		});
	}
}
