import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { BaseService } from '@/common/services/base.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { EVENT } from '@/modules/search/constants/event.constant';
import { BookLocationUpdatedEvent } from './events/book-location-updated.event';

import type { BookLocation } from '@/generated/prisma/client';

@Injectable()
export class BookLocationService extends BaseService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventEmitter: EventEmitter2,
		readonly logger: PinoLogger,
	) {
		super(logger);
	}

	getAll(): Promise<BookLocation[]> {
		return this.prisma.bookLocation.findMany();
	}

	async create(body: Prisma.BookLocationCreateInput): Promise<BookLocation> {
		const bookLocation = await this.prisma.bookLocation.create({
			data: body,
		});

		this.logger.info(
			{
				event: 'BOOK_LOCATION_CREATE',
				action: 'CREATE_BOOK_LOCATION',
				bookLocationIdTarget: bookLocation.id,
				success: true,
			},
			'Book Location created',
		);

		return bookLocation;
	}

	async update(id: number, body: Prisma.BookLocationUpdateInput): Promise<BookLocation> {
		const bookLocation = await this.prisma.bookLocation.update({
			where: { id },
			data: body,
			include: {
				books: {
					select: {
						id: true,
					},
				},
			},
		});

		if (bookLocation.books.length > 0) {
			this.eventEmitter.emit(
				EVENT.BOOK_LOCATION.UPDATED,
				new BookLocationUpdatedEvent({
					...bookLocation,
					bookIds: bookLocation.books.map((book) => book.id),
				}),
			);
		}

		this.logger.info(
			{
				event: 'BOOK_LOCATION_UPDATE',
				action: 'UPDATE_BOOK_LOCATION',
				bookLocationIdTarget: id,
				success: true,
			},
			'Book Location updated',
		);

		return bookLocation;
	}

	async delete(id: number): Promise<BookLocation> {
		const bookCount = await this.prisma.book.count({
			where: { bookLocationId: id },
		});

		if (bookCount > 0) {
			this.logger.warn(
				{
					event: 'BOOK_LOCATION_DELETE',
					action: 'CHECK_BOOK_LOCATION_ASSOCIATED',
					bookLocationIdTarget: id,
					success: false,
				},
				'Delete Book Location with associated Books attempt',
			);
			throw new BadRequestException('Cannot delete Book Location with associated Books');
		}

		const deletedBookLocation = await this.prisma.bookLocation.delete({
			where: { id },
		});

		this.logger.info(
			{
				event: 'BOOK_LOCATION_DELETE',
				action: 'DELETE_BOOK_LOCATION',
				bookLocationIdTarget: id,
				success: true,
			},
			'Book Location deleted',
		);

		return deletedBookLocation;
	}

	findUnique(name: string): Promise<BookLocation | null> {
		return this.prisma.bookLocation.findUnique({
			where: { name },
		});
	}
}
