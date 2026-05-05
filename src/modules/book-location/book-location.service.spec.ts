import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BookLocationService } from './book-location.service';

import { mockPrisma } from 'mocks/@/generated/prisma/client';
import { mockLogger } from '@/testing/mocks/logger';
import { expectHttpException } from '@/testing/helpers/expect-http-exception';

describe('BookLocationService', () => {
	let service: BookLocationService;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BookLocationService,
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

		service = module.get<BookLocationService>(BookLocationService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('success cases', () => {
		// get all
		describe('getAll', () => {
			it('should return book locations', async () => {
				const mockResponse = [{ id: 1, name: 'A-10' }];

				mockPrisma.bookLocation.findMany.mockResolvedValue(mockResponse);

				const result = await service.getAll();

				expect(mockPrisma.bookLocation.findMany).toHaveBeenCalled();
				expect(result).toEqual(mockResponse);
			});
		});

		// create
		describe('create', () => {
			it('should create book location successfully', async () => {
				const createdBookLocation = { id: 1, name: 'A-10' };

				mockPrisma.bookLocation.create.mockResolvedValue(createdBookLocation);

				const result = await service.create({ name: 'A-10' });

				expect(mockPrisma.bookLocation.create).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_LOCATION_CREATE',
						action: 'CREATE_BOOK_LOCATION',
						bookLocationIdTarget: createdBookLocation.id,
						success: true,
					}),
					'Book Location created',
				);
				expect(result).toEqual(createdBookLocation);
			});
		});

		// update
		describe('update', () => {
			it('should update book location successfully', async () => {
				const updatedBookLocation = { id: 1, name: 'E-05' };

				mockPrisma.bookLocation.update.mockResolvedValue(updatedBookLocation);

				const result = await service.update(updatedBookLocation.id, { name: 'E-05' });

				expect(mockPrisma.bookLocation.update).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_LOCATION_UPDATE',
						action: 'UPDATE_BOOK_LOCATION',
						bookLocationIdTarget: updatedBookLocation.id,
						success: true,
					}),
					'Book Location updated',
				);
				expect(result).toEqual(updatedBookLocation);
			});
		});

		// delete
		describe('delete', () => {
			it('should delete book location successfully', async () => {
				const deletedBookLocation = { id: 1, name: 'E-05' };

				mockPrisma.book.count.mockResolvedValue(0);
				mockPrisma.bookLocation.delete.mockResolvedValue(deletedBookLocation);

				const result = await service.delete(deletedBookLocation.id);

				expect(mockPrisma.book.count).toHaveBeenCalledWith({
					where: {
						bookLocationId: deletedBookLocation.id,
					},
				});
				expect(mockPrisma.bookLocation.delete).toHaveBeenCalled();
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_LOCATION_DELETE',
						action: 'DELETE_BOOK_LOCATION',
						bookLocationIdTarget: deletedBookLocation.id,
						success: true,
					}),
					'Book Location deleted',
				);
				expect(result).toEqual(deletedBookLocation);
			});
		});

		// find unique
		describe('findUnique', () => {
			it('should find unique book location with name', async () => {
				mockPrisma.bookLocation.findUnique.mockResolvedValue({ id: 1, name: 'A-10' });

				const result = await service.findUnique('A-10');

				expect(mockPrisma.bookLocation.findUnique).toHaveBeenCalled();
				expect(result).toEqual({ id: 1, name: 'A-10' });
			});
		});
	});

	describe('fail cases', () => {
		// delete
		describe('delete', () => {
			it('should throw if book location associated wih books', async () => {
				const id = 1;

				mockPrisma.book.count.mockResolvedValue(1);

				await expectHttpException(
					service.delete(id),
					BadRequestException,
					'Cannot delete Book Location with associated Books',
				);

				expect(mockPrisma.book.count).toHaveBeenCalledWith({
					where: {
						bookLocationId: id,
					},
				});
				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						event: 'BOOK_LOCATION_DELETE',
						action: 'CHECK_BOOK_LOCATION_ASSOCIATED',
						bookLocationIdTarget: id,
						success: false,
					}),
					'Delete Book Location with associated Books attempt',
				);
				expect(mockPrisma.bookLocation.delete).not.toHaveBeenCalled();
			});
		});
	});
});
