import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BookCategoryService } from '@/modules/book-category/book-category.service';
import { BookLocationService } from '@/modules/book-location/book-location.service';
import { BookService } from './book.service';

import { mockPrisma } from 'mocks/@/generated/prisma/client';
import { mockLogger } from '@/testing/mocks/logger';
import { expectHttpException } from '@/testing/helpers/expect-http-exception';

describe('BookService', () => {
	let service: BookService;

	const mockBookCategoryService = mockPrisma.bookCategory;
	const mockBookLocationService = mockPrisma.bookLocation;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BookService,
				{
					provide: PrismaService,
					useValue: mockPrisma,
				},
				{
					provide: BookCategoryService,
					useValue: mockBookCategoryService,
				},
				{
					provide: BookLocationService,
					useValue: mockBookLocationService,
				},
				{
					provide: PinoLogger,
					useValue: mockLogger,
				},
			],
		}).compile();

		service = module.get<BookService>(BookService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	const bookDto = {
		title: 'Book A',
		author: 'Author A',
		year: 2024,
		publisher: 'Publisher A',
		description: null,
		category: 'Programming',
		bookLocation: 'A-10',
	};

	describe('success cases', () => {
		// get all
		describe('getAll', () => {
			const mockBooks = [
				{
					id: 1,
					title: 'Test Book',
				},
			];

			const baseQuery = {
				page: 1,
				limit: 10,
				createdAtSort: null,
				titleSort: null,
				authorSort: null,
				yearSort: null,
				publisherSort: null,
				categorySort: null,
				bookLocationSort: null,
				bookCategoryFilter: null,
				bookLocationFilter: null,
				titleFilter: null,
			};

			it('should return paginated books with empty query param', async () => {
				mockPrisma.book.findMany.mockResolvedValue(mockBooks);
				mockPrisma.book.count.mockResolvedValue(1);

				const result = await service.getAll();

				expect(mockPrisma.book.findMany).toHaveBeenCalled();
				expect(mockPrisma.book.count).toHaveBeenCalled();
				expect(result.meta.total).toBe(1);
				expect(result.meta.page).toBe(1);
				expect(result.meta.limit).toBe(20);
				expect(result.meta.totalPages).toBe(1);
				expect(result.data).toEqual(mockBooks);
			});

			it('should calculate totalPages correctly', async () => {
				mockPrisma.book.findMany.mockResolvedValue(mockBooks);
				mockPrisma.book.count.mockResolvedValue(21);

				const result = await service.getAll(baseQuery);

				expect(result.meta.totalPages).toBe(3);
			});

			describe('sorting', () => {
				it.each([
					['createdAtSort', { createdAt: 'asc' }],
					['titleSort', { title: 'asc' }],
					['authorSort', { author: 'asc' }],
					['yearSort', { year: 'asc' }],
					['publisherSort', { publisher: 'asc' }],
					['categorySort', { bookCategory: { name: 'asc' } }],
					['bookLocationSort', { bookLocation: { name: 'asc' } }],
				])('should return paginated books with sort by %s', async (field, expected) => {
					mockPrisma.book.findMany.mockResolvedValue(mockBooks);
					mockPrisma.book.count.mockResolvedValue(1);

					const result = await service.getAll({
						...baseQuery,
						[field]: 'asc',
					});

					expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
						expect.objectContaining({
							orderBy: [expected],
						}),
					);
					expect(mockPrisma.book.count).toHaveBeenCalled();
					expect(result.meta.total).toBe(1);
					expect(result.data).toEqual(mockBooks);
				});
			});

			describe('filtering', () => {
				it.each([
					[
						'titleFilter',
						'C',
						{
							title: { contains: 'C', mode: 'insensitive' },
						},
					],
					[
						'bookCategoryFilter',
						'Pro',
						{
							bookCategory: {
								name: { contains: 'Pro', mode: 'insensitive' },
							},
						},
					],
					[
						'bookLocationFilter',
						'A',
						{
							bookLocation: {
								name: { contains: 'A', mode: 'insensitive' },
							},
						},
					],
				])('should return paginated books with filter by %s', async (field, value, expectedWhere) => {
					mockPrisma.book.findMany.mockResolvedValue(mockBooks);
					mockPrisma.book.count.mockResolvedValue(1);

					const result = await service.getAll({
						...baseQuery,
						[field]: value,
					});

					expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
						expect.objectContaining({
							where: expectedWhere,
						}),
					);
					expect(mockPrisma.book.count).toHaveBeenCalled();
					expect(result.meta.total).toBe(1);
					expect(result.data).toEqual(mockBooks);
				});
			});
		});

		// create
		describe('create', () => {
			it('should create book successfully', async () => {
				const dto = {
					category: 'Programming',
					location: 'A-10',
				};

				mockBookCategoryService.findUnique.mockResolvedValue({ name: dto.category });
				mockBookLocationService.findUnique.mockResolvedValue({ name: dto.location });

				const createdBook = { id: 1, ...bookDto };
				mockPrisma.book.create.mockResolvedValue(createdBook);

				const result = await service.create(bookDto);

				expect(mockBookCategoryService.findUnique).toHaveBeenCalledWith(dto.category);
				expect(mockBookLocationService.findUnique).toHaveBeenCalledWith(dto.location);
				expect(mockPrisma.book.create).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CREATE',
						action: 'CREATE_BOOK',
						bookIdTarget: createdBook.id,
						success: true,
					}),
					'Book created',
				);
				expect(result).toEqual(createdBook);
			});
		});

		// update
		describe('update', () => {
			it('should update book successfully', async () => {
				const dto = {
					title: 'Updated',
					category: 'Computer',
					location: 'E-10',
				};

				mockBookCategoryService.findUnique.mockResolvedValue({ name: dto.category });
				mockBookLocationService.findUnique.mockResolvedValue({ name: dto.location });

				const updatedBook = {
					id: 1,
					...dto,
				};
				mockPrisma.book.update.mockResolvedValue(updatedBook);

				const result = await service.update(1, {
					title: dto.title,
					category: dto.category,
					bookLocation: dto.location,
				});

				expect(mockBookCategoryService.findUnique).toHaveBeenCalledWith(dto.category);
				expect(mockBookLocationService.findUnique).toHaveBeenCalledWith(dto.location);
				expect(mockPrisma.book.update).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_UPDATE',
						action: 'UPDATE_BOOK',
						bookIdTarget: updatedBook.id,
						success: true,
					}),
					'Book updated',
				);
				expect(result).toEqual(updatedBook);
			});
		});

		// delete
		describe('delete', () => {
			it('should delete book successfully', async () => {
				const deletedBook = { id: 1, title: 'Deleted Book' };
				mockPrisma.book.delete.mockResolvedValue(deletedBook);

				const result = await service.delete(1);

				expect(mockPrisma.book.delete).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_DELETE',
						action: 'DELETE_BOOK',
						bookIdTarget: deletedBook.id,
						success: true,
					}),
					'Book deleted',
				);
				expect(result).toEqual(deletedBook);
			});
		});
	});

	describe('fail cases', () => {
		// create
		describe('create', () => {
			it('should throw if book category not found', async () => {
				mockBookCategoryService.findUnique.mockResolvedValue(null);

				await expectHttpException(
					service.create(bookDto),
					NotFoundException,
					'Book Category does not exist',
				);

				expect(mockBookCategoryService.findUnique).toHaveBeenCalledWith(bookDto.category);
				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CREATE',
						action: 'CHECK_CATEGORY',
						categoryTarget: bookDto.category,
						success: false,
					}),
					'Missing Book Category on create',
				);
				expect(mockPrisma.book.create).not.toHaveBeenCalled();
			});

			it('should throw if book location not found', async () => {
				mockBookCategoryService.findUnique.mockResolvedValue({ name: bookDto.category });
				mockBookLocationService.findUnique.mockResolvedValue(null);

				await expectHttpException(
					service.create(bookDto),
					NotFoundException,
					'Book Location does not exist',
				);

				expect(mockBookCategoryService.findUnique).toHaveBeenCalledWith(bookDto.category);
				expect(mockBookLocationService.findUnique).toHaveBeenCalledWith(bookDto.bookLocation);
				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CREATE',
						action: 'CHECK_LOCATION',
						locationTarget: bookDto.bookLocation,
						success: false,
					}),
					'Missing Book Location on create',
				);
				expect(mockPrisma.book.create).not.toHaveBeenCalled();
			});
		});

		// update
		describe('update', () => {
			it('should throw if update book category not found', async () => {
				mockBookCategoryService.findUnique.mockResolvedValue(null);

				await expectHttpException(
					service.update(1, { category: bookDto.category }),
					NotFoundException,
					'Book Category does not exist',
				);

				expect(mockBookCategoryService.findUnique).toHaveBeenCalledWith(bookDto.category);
				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_UPDATE',
						action: 'CHECK_CATEGORY',
						categoryTarget: bookDto.category,
						success: false,
					}),
					'Missing Book Category on update',
				);
				expect(mockPrisma.book.update).not.toHaveBeenCalled();
			});

			it('should throw if update book location not found', async () => {
				mockBookLocationService.findUnique.mockResolvedValue(null);

				await expectHttpException(
					service.update(1, { bookLocation: bookDto.bookLocation }),
					NotFoundException,
					'Book Location does not exist',
				);

				expect(mockBookLocationService.findUnique).toHaveBeenCalledWith(bookDto.bookLocation);
				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_UPDATE',
						action: 'CHECK_LOCATION',
						locationTarget: bookDto.bookLocation,
						success: false,
					}),
					'Missing Book Location on update',
				);
				expect(mockPrisma.book.update).not.toHaveBeenCalled();
			});
		});
	});
});
