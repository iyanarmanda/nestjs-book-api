import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { Meilisearch } from 'meilisearch';

config({
	path: `.env.${process.env.NODE_ENV}`,
	quiet: true,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const meili = new Meilisearch({
	host: `${process.env.MEILI_HOST}:${process.env.MEILI_PORT}`,
	apiKey: process.env.MEILI_MASTER_KEY,
});

async function main() {
	console.log('Start indexing Meilisearch...');

	const indexName = 'books';

	try {
		const books = await prisma.book.findMany({
			include: {
				bookCategory: true,
				bookLocation: true,
			},
		});

		if (books.length === 0) {
			console.warn('No books found in database. Skipping...');
			return;
		}

		const documents = books.map((book) => ({
			id: book.id,
			title: book.title,
			author: book.author,
			year: book.year,
			publisher: book.publisher,
			description: book.description,
			category: book.bookCategory?.name,
			categoryId: book.bookCategoryId,
			bookLocation: book.bookLocation?.name,
			bookLocationId: book.bookLocationId,
			createdAt: book.createdAt.getTime(),
		}));

		console.log(`Cleaning index: ${indexName}`);
		await meili.deleteIndex(indexName).catch(() => {});

		await meili.createIndex(indexName, { primaryKey: 'id' });

		const index = meili.index(indexName);

		await index.updateSettings({
			searchableAttributes: ['title', 'author', 'description', 'publisher'],
			filterableAttributes: ['category', 'year', 'bookLocation'],
			sortableAttributes: ['year', 'createdAt'],
		});

		const task = await index.addDocuments(documents);
		console.log(`Enqueued ${documents.length} documents. Task UID: ${task.taskUid}`);
	} catch (error) {
		console.error('Re-index failed:', error);
	}

	console.log('Meilisearch indexing completed');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
