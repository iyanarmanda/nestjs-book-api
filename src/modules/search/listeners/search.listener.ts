import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { BaseService } from '@/common/services/base.service';
import { SearchService } from '../search.service';
import { EVENT } from '../constants/event.constant';

import type { BookCreatedEvent } from '@/modules/book/events/book-created.event';
import type { BookDeletedEvent } from '@/modules/book/events/book-deleted.event';
import type { BookUpdatedEvent } from '@/modules/book/events/book-updated.event';
import type { BookLocationUpdatedEvent } from '@/modules/book-location/events/book-location-updated.event';
import type { BookCategoryUpdatedEvent } from '@/modules/book-category/events/book-category-updated.event';

@Injectable()
export class SearchListener extends BaseService {
	constructor(
		private readonly searchService: SearchService,
		readonly logger: PinoLogger,
	) {
		super(logger);
	}

	@OnEvent(EVENT.BOOK.CREATED)
	async handleBookCreatedEvent(payload: BookCreatedEvent): Promise<void> {
		try {
			await this.searchService.indexBook(payload.book);
		} catch (err) {
			this.logger.error(
				{
					event: 'BOOK_CREATE',
					action: 'INDEX_BOOK',
					bookIdTarget: payload.book.id,
					success: false,
					error: err.message,
				},
				'Failed to index book after creation',
			);
		}
	}

	@OnEvent(EVENT.BOOK.UPDATED)
	async handleBookUpdatedEvent(payload: BookUpdatedEvent): Promise<void> {
		try {
			await this.searchService.updateBook(payload.book);
		} catch (err) {
			this.logger.error(
				{
					event: 'BOOK_UPDATE',
					action: 'UPDATE_BOOK_INDEX',
					bookIdTarget: payload.book.id,
					success: false,
					error: err.message,
				},
				'Failed to update book index after update',
			);
		}
	}

	@OnEvent(EVENT.BOOK_CATEGORY.UPDATED)
	async handleBookCategoryUpdatedEvent(payload: BookCategoryUpdatedEvent): Promise<void> {
		try {
			await this.searchService.updateBooksByCategory(payload.bookCategory);
		} catch (err) {
			this.logger.error(
				{
					event: 'BOOK_CATEGORY_UPDATE',
					action: 'UPDATE_BOOKS_INDEX_BY_CATEGORY',
					bookCategoryIdTarget: payload.bookCategory.id,
					success: false,
					error: err.message,
				},
				'Failed to update books index by category after update',
			);
		}
	}

	@OnEvent(EVENT.BOOK_LOCATION.UPDATED)
	async handleBookLocationUpdatedEvent(payload: BookLocationUpdatedEvent): Promise<void> {
		try {
			await this.searchService.updateBooksByLocation(payload.bookLocation);
		} catch (err) {
			this.logger.error(
				{
					event: 'BOOK_LOCATION_UPDATE',
					action: 'UPDATE_BOOKS_INDEX_BY_LOCATION',
					bookLocationIdTarget: payload.bookLocation.id,
					success: false,
					error: err.message,
				},
				'Failed to update books index by location after update',
			);
		}
	}

	@OnEvent(EVENT.BOOK.DELETED)
	async handleBookDeletedEvent(payload: BookDeletedEvent): Promise<void> {
		try {
			await this.searchService.deleteBook(payload.bookId);
		} catch (err) {
			this.logger.error(
				{
					event: 'BOOK_DELETE',
					action: 'DELETE_BOOK_INDEX',
					bookIdTarget: payload.bookId,
					success: false,
					error: err.message,
				},
				'Failed to delete book index after deletion',
			);
		}
	}
}
