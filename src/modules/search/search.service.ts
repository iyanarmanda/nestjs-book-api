import { Injectable, OnModuleInit } from '@nestjs/common';
import { MeilisearchService } from '@/common/search/meilisearch.service';
import { SEARCH_INDEX } from './constants/search.constant';

import type { EnqueuedTask } from 'meilisearch';
import type { Book } from '@/generated/prisma/client';
import type { BookCreatedEvent } from '@/modules/book/events/book-created.event';
import type { BookUpdatedEvent } from '@/modules/book/events/book-updated.event';
import type { BookCategoryUpdatedEvent } from '@/modules/book-category/events/book-category-updated.event';
import type { BookLocationUpdatedEvent } from '@/modules/book-location/events/book-location-updated.event';
import type { BookDeletedEvent } from '@/modules/book/events/book-deleted.event';
import type { BookSearchDocument } from './interfaces/book-search.interface';

@Injectable()
export class SearchService implements OnModuleInit {
	private readonly indexName = SEARCH_INDEX.BOOKS;

	constructor(private readonly meilisearchService: MeilisearchService) {}

	async onModuleInit() {
		await this.setupIndex();
	}

	async setupIndex(): Promise<EnqueuedTask> {
		const index = this.meilisearchService.index(this.indexName);

		await this.meilisearchService
			.getClient()
			.createIndex(this.indexName, {
				primaryKey: 'id',
			})
			.catch(() => {});

		return await index.updateSettings({
			searchableAttributes: ['title', 'author', 'description', 'publisher'],
			filterableAttributes: ['category', 'year', 'bookLocation'],
			sortableAttributes: ['year', 'createdAt'],
		});
	}

	private mapToDocument(
		book: Book & { category: string; bookLocation: string },
	): BookSearchDocument {
		return {
			id: book.id,
			title: book.title,
			author: book.author,
			year: book.year,
			publisher: book.publisher,
			description: book.description,
			category: book.category,
			categoryId: book.bookCategoryId,
			bookLocation: book.bookLocation,
			bookLocationId: book.bookLocationId,
			createdAt: book.createdAt.getTime(),
		};
	}

	async indexBook(book: BookCreatedEvent['book']): Promise<EnqueuedTask> {
		const index = this.meilisearchService.index(this.indexName);
		const document = this.mapToDocument(book);

		return await index.addDocuments([document]);
	}

	async updateBook(book: BookUpdatedEvent['book']): Promise<EnqueuedTask> {
		const index = this.meilisearchService.index(this.indexName);
		const document = this.mapToDocument(book);

		return await index.updateDocuments([document]);
	}

	async updateBooksByCategory(
		bookCategory: BookCategoryUpdatedEvent['bookCategory'],
	): Promise<EnqueuedTask> {
		const index = this.meilisearchService.index(this.indexName);

		const updates = bookCategory.bookIds.map((bookId) => ({
			id: bookId,
			bookCategory: bookCategory.name,
		}));

		return await index.updateDocuments(updates);
	}

	async updateBooksByLocation(
		bookLocation: BookLocationUpdatedEvent['bookLocation'],
	): Promise<EnqueuedTask> {
		const index = this.meilisearchService.index(this.indexName);

		const updates = bookLocation.bookIds.map((bookId) => ({
			id: bookId,
			bookLocation: bookLocation.name,
		}));

		return await index.updateDocuments(updates);
	}

	async deleteBook(bookId: BookDeletedEvent['bookId']): Promise<EnqueuedTask> {
		const index = this.meilisearchService.index(this.indexName);

		return await index.deleteDocument(bookId);
	}
}
