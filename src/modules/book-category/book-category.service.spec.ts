import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BookCategoryService } from './book-category.service';

import { mockPrisma } from 'mocks/@/generated/prisma/client';
import { mockLogger } from '@/testing/mocks/logger';
import { expectHttpException } from '@/testing/helpers/expect-http-exception';

describe('BookCategoryService', () => {
	let service: BookCategoryService;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BookCategoryService,
				{
					provide: PrismaService,
					useValue: mockPrisma,
				},
				{
					provide: PinoLogger,
					useValue: mockLogger,
				},
			],
		}).compile();

		service = module.get<BookCategoryService>(BookCategoryService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('success cases', () => {
		// get all
		describe('getAll', () => {
			it('should return book categories', async () => {
				const mockResponse = [{ id: 1, name: 'Programming' }];

				mockPrisma.bookCategory.findMany.mockResolvedValue(mockResponse);

				const result = await service.getAll();

				expect(mockPrisma.bookCategory.findMany).toHaveBeenCalled();
				expect(result).toEqual(mockResponse);
			});
		});

		// create
		describe('create', () => {
			it('should create book category successfully', async () => {
				const createdBookCategory = { id: 1, name: 'Programming' };

				mockPrisma.bookCategory.create.mockResolvedValue(createdBookCategory);

				const result = await service.create({ name: 'Programming' });

				expect(mockPrisma.bookCategory.create).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CATEGORY_CREATE',
						action: 'CREATE_BOOK_CATEGORY',
						bookCategoryIdTarget: createdBookCategory.id,
						success: true,
					}),
					'Book Category created',
				);
				expect(result).toEqual(createdBookCategory);
			});
		});

		// update
		describe('update', () => {
			it('should update book category successfully', async () => {
				const updatedBookCategory = { id: 1, name: 'Computer' };

				mockPrisma.bookCategory.update.mockResolvedValue(updatedBookCategory);

				const result = await service.update(updatedBookCategory.id, { name: 'Computer' });

				expect(mockPrisma.bookCategory.update).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CATEGORY_UPDATE',
						action: 'UPDATE_BOOK_CATEGORY',
						bookCategoryIdTarget: updatedBookCategory.id,
						success: true,
					}),
					'Book Category updated',
				);
				expect(result).toEqual(updatedBookCategory);
			});
		});

		// delete
		describe('delete', () => {
			it('should delete book category successfully', async () => {
				const deletedBookCategory = { id: 1, name: 'Computer' };

				mockPrisma.book.count.mockResolvedValue(0);
				mockPrisma.bookCategory.delete.mockResolvedValue(deletedBookCategory);

				const result = await service.delete(deletedBookCategory.id);

				expect(mockPrisma.book.count).toHaveBeenCalledWith({
					where: {
						bookCategoryId: deletedBookCategory.id,
					},
				});
				expect(mockPrisma.bookCategory.delete).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CATEGORY_DELETE',
						action: 'DELETE_BOOK_CATEGORY',
						bookCategoryIdTarget: deletedBookCategory.id,
						success: true,
					}),
					'Book Category deleted',
				);
				expect(result).toEqual(deletedBookCategory);
			});
		});

		// find unique
		describe('findUnique', () => {
			it('should find unique book category with name', async () => {
				mockPrisma.bookCategory.findUnique.mockResolvedValue({ id: 1, name: 'Programming' });

				const result = await service.findUnique('Programming');

				expect(mockPrisma.bookCategory.findUnique).toHaveBeenCalled();
				expect(result).toEqual({ id: 1, name: 'Programming' });
			});
		});
	});

	describe('fail cases', () => {
		// delete
		describe('delete', () => {
			it('should throw if book category associated wih books', async () => {
				const id = 1;

				mockPrisma.book.count.mockResolvedValue(1);

				await expectHttpException(
					service.delete(id),
					BadRequestException,
					'Cannot delete Book Category with associated Books',
				);

				expect(mockPrisma.book.count).toHaveBeenCalledWith({
					where: {
						bookCategoryId: id,
					},
				});
				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_CATEGORY_DELETE',
						action: 'CHECK_BOOK_CATEGORY_ASSOCIATED',
						bookCategoryIdTarget: id,
						success: false,
					}),
					'Delete Book Category with associated Books attempt',
				);
				expect(mockPrisma.bookCategory.delete).not.toHaveBeenCalled();
			});
		});
	});
});
