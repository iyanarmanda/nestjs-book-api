import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { BaseService } from '@/common/services/base.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { BookCategoryService } from '@/modules/book-category/book-category.service';
import { BookLocationService } from '@/modules/book-location/book-location.service';

import type { Book } from '@/generated/prisma/client';
import type { CreateBookDto } from './schemas/create-book.schema';
import type { GetAllQueryBookDto } from './schemas/get-all-query-book.schema';
import type { UpdateBookDto } from './schemas/update-book.schema';
import type { PaginatedResponse } from './interfaces/response.interface';

@Injectable()
export class BookService extends BaseService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly bookCategoryService: BookCategoryService,
		private readonly bookLocationService: BookLocationService,
		readonly logger: PinoLogger,
	) {
		super(logger);
	}

	async getAll(query?: GetAllQueryBookDto): Promise<PaginatedResponse> {
		const page = query?.page ?? 1;
		const limit = query?.limit ?? 20;

		const orderBy: Prisma.BookOrderByWithRelationInput[] = [];

		if (query?.createdAtSort) orderBy.push({ createdAt: query.createdAtSort });
		if (query?.titleSort) orderBy.push({ title: query.titleSort });
		if (query?.authorSort) orderBy.push({ author: query.authorSort });
		if (query?.yearSort) orderBy.push({ year: query.yearSort });
		if (query?.publisherSort) orderBy.push({ publisher: query.publisherSort });
		if (query?.categorySort) orderBy.push({ bookCategory: { name: query.categorySort } });
		if (query?.bookLocationSort) orderBy.push({ bookLocation: { name: query.bookLocationSort } });

		if (orderBy.length === 0) {
			orderBy.push({ createdAt: 'desc' });
		}

		const where: Prisma.BookWhereInput = {};

		if (query?.titleFilter) {
			where.title = { contains: query.titleFilter, mode: 'insensitive' };
		}

		if (query?.bookCategoryFilter) {
			where.bookCategory = {
				name: {
					contains: query.bookCategoryFilter,
					mode: 'insensitive',
				},
			};
		}

		if (query?.bookLocationFilter) {
			where.bookLocation = {
				name: {
					contains: query.bookLocationFilter,
					mode: 'insensitive',
				},
			};
		}

		const [books, total] = await Promise.all([
			this.prisma.book.findMany({
				where,
				include: {
					bookCategory: true,
					bookLocation: true,
				},
				orderBy,
				skip: (page - 1) * limit,
				take: limit,
			}),
			this.prisma.book.count({ where }),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			meta: {
				total,
				page,
				limit,
				totalPages,
			},
			data: books,
		};
	}

	async create(body: CreateBookDto): Promise<Book> {
		const category = await this.bookCategoryService.findUnique(body.category);
		if (!category) {
			this.logger.warn(
				{
					event: 'BOOK_CREATE',
					action: 'CHECK_CATEGORY',
					categoryTarget: body.category,
					success: false,
				},
				'Missing Book Category on create',
			);
			throw new NotFoundException('Book Category does not exist');
		}

		const bookLocation = await this.bookLocationService.findUnique(body.bookLocation);
		if (!bookLocation) {
			this.logger.warn(
				{
					event: 'BOOK_CREATE',
					action: 'CHECK_LOCATION',
					locationTarget: body.bookLocation,
					success: false,
				},
				'Missing Book Location on create',
			);
			throw new NotFoundException('Book Location does not exist');
		}

		const book = await this.prisma.book.create({
			data: {
				title: body.title,
				author: body.author,
				year: body.year,
				publisher: body.publisher,
				description: body.description,
				bookCategory: {
					connect: {
						name: body.category,
					},
				},
				bookLocation: {
					connect: {
						name: body.bookLocation,
					},
				},
			},
		});

		this.logger.info(
			{
				event: 'BOOK_CREATE',
				action: 'CREATE_BOOK',
				bookIdTarget: book.id,
				success: true,
			},
			'Book created',
		);

		return book;
	}

	async update(id: number, body: UpdateBookDto): Promise<Book> {
		if (body.category) {
			const category = await this.bookCategoryService.findUnique(body.category);
			if (!category) {
				this.logger.warn(
					{
						event: 'BOOK_UPDATE',
						action: 'CHECK_CATEGORY',
						categoryTarget: body.category,
						success: false,
					},
					'Missing Book Category on update',
				);
				throw new NotFoundException('Book Category does not exist');
			}
		}

		if (body.bookLocation) {
			const bookLocation = await this.bookLocationService.findUnique(body.bookLocation);
			if (!bookLocation) {
				this.logger.warn(
					{
						event: 'BOOK_UPDATE',
						action: 'CHECK_LOCATION',
						locationTarget: body.bookLocation,
						success: false,
					},
					'Missing Book Location on update',
				);
				throw new NotFoundException('Book Location does not exist');
			}
		}

		const book = await this.prisma.book.update({
			where: { id },
			data: {
				...(body.title && { title: body.title }),
				...(body.author && { author: body.author }),
				...(body.year && { year: body.year }),
				...(body.publisher !== undefined && { publisher: body.publisher }),
				...(body.description !== undefined && { description: body.publisher }),
				...(body.category && {
					bookCategory: {
						connect: {
							name: body.category,
						},
					},
				}),
				...(body.bookLocation && {
					bookLocation: {
						connect: {
							name: body.bookLocation,
						},
					},
				}),
			},
		});

		this.logger.info(
			{
				event: 'BOOK_UPDATE',
				action: 'UPDATE_BOOK',
				bookIdTarget: book.id,
				success: true,
			},
			'Book updated',
		);

		return book;
	}

	async delete(id: number): Promise<Book> {
		const deletedBook = await this.prisma.book.delete({
			where: { id },
		});

		this.logger.info(
			{
				event: 'BOOK_DELETE',
				action: 'DELETE_BOOK',
				bookIdTarget: id,
				success: true,
			},
			'Book deleted',
		);

		return deletedBook;
	}
}
