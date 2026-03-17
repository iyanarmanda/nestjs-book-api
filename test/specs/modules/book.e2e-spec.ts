import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CoreModule } from '@/core/core.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { BookModule } from '@/modules/book/book.module';
import { PrismaExceptionFilter } from '@/config/filters/prisma-exception.filter';
import { PrismaService } from '@/common/prisma/prisma.service';
import { bookCategorySeeder } from '$/seeds/models/book-category/book-category.seeder';
import { bookLocationSeeder } from '$/seeds/models/book-location/book-location.seeder';
import { bookSeeder } from '$/seeds/models/book/book.seeder';
import { adminSeeder } from '$/seeds/models/admin/admin.seeder';
import { trucateDatabase } from '$/helper/truncate';
import { login } from '#/helper/auth.helper';
import { bookData } from '#/seeds/data/book.data';
import { bookLocationData } from '#/seeds/data/book-location.data';
import { bookCategoryData } from '#/seeds/data/book-category.data';

import type { App } from 'supertest/types';
import type { TestingModule } from '@nestjs/testing';
import type { Book } from '@/generated/prisma/client';

describe('BookModule (e2e)', () => {
	let app: INestApplication<App>;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [CoreModule, AuthModule, BookModule],
		})
			.overrideGuard(ThrottlerGuard)
			.useValue({
				canActive: () => true,
			})
			.compile();

		app = moduleFixture.createNestApplication();

		prisma = moduleFixture.get(PrismaService);

		app.setGlobalPrefix('api');
		app.useGlobalFilters(new PrismaExceptionFilter());

		await app.init();
	});

	beforeEach(async () => {
		await trucateDatabase(prisma);

		await Promise.all([
			bookCategorySeeder(prisma, bookCategoryData),
			bookLocationSeeder(prisma, bookLocationData),
		]);
	});

	afterAll(async () => {
		await prisma.$disconnect();
		await app.close();
	});

	describe('success cases', () => {
		describe('GET /api/book', () => {
			const route = '/api/book';

			it('should return paginated books without query', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer()).get(route).expect(200);

				expect(res.body).toHaveProperty('data');
				expect(Array.isArray(res.body.data)).toBe(true);
				expect(res.body.data.length).toBeGreaterThan(0);

				expect(res.body).toHaveProperty('meta');
				expect(res.body.meta).toHaveProperty('page');
				expect(res.body.meta).toHaveProperty('limit');
				expect(res.body.meta).toHaveProperty('total');
				expect(res.body.meta).toHaveProperty('totalPages');
			});

			it('should return paginated books with pagination queries', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer()).get(`${route}?page=1&limit=5`).expect(200);

				expect(res.body.data.length).toBeLessThanOrEqual(res.body.meta.limit);
				expect(res.body.meta.page).toBe(1);
				expect(res.body.meta.limit).toBe(5);
			});

			it('should return filtered books by title', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer()).get(`${route}?titleFilter=Meow`).expect(200);

				for (const book of res.body.data) {
					expect(book.title.toLowerCase()).toContain('meow');
				}
			});

			it('should return filtered books by category', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer())
					.get(`${route}?bookCategoryFilter=Machine Learning`)
					.expect(200);

				expect(res.body.data.length).toBeGreaterThan(0);

				for (const book of res.body.data) {
					expect(book.bookCategory.name).toBe('Machine Learning');
				}
			});

			it('should return sorted books by year desc', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer()).get(`${route}?yearSort=desc`).expect(200);

				const years = res.body.data.map((b: Book) => b.year);

				const sorted = [...years].sort((a: number, b: number) => b - a);

				expect(years).toStrictEqual(sorted);
			});

			it('should return sorted books by book location desc', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer())
					.get(`${route}?bookLocationSort=desc`)
					.expect(200);

				const bookLocations = res.body.data.map((b: any) => b.bookLocation.name);

				const sorted = [...bookLocations].sort((a: string, b: string) => b.localeCompare(a));

				expect(bookLocations).toStrictEqual(sorted);
			});

			it('should return books with combinated filter and sort queries', async () => {
				await bookSeeder(prisma, bookData);

				const res = await request(app.getHttpServer())
					.get(`${route}?bookCategoryFilter=Programming&yearSort=desc`)
					.expect(200);

				const years = res.body.data.map((b: Book) => b.year);

				const sorted = [...years].sort((a, b) => b - a);

				expect(years).toStrictEqual(sorted);
			});
		});

		describe('POST /api/book', () => {
			const route = '/api/book';

			it('should create book successfully', async () => {
				await adminSeeder(prisma);
				const token = await login(app);

				const res = await request(app.getHttpServer())
					.post(route)
					.set('Authorization', `Bearer ${token}`)
					.send({
						title: 'New Book',
						author: 'Me',
						year: 2026,
						publisher: null,
						description: null,
						category: 'Programming',
						bookLocation: 'A-01',
					})
					.expect(201);

				expect(res.body.message).toBe('Book created successfully');

				const book = await prisma.book.findFirst({
					where: { title: 'New Book' },
				});

				expect(book).toBeDefined();
			});
		});

		describe('PATCH /api/book/:id', () => {
			const route = '/api/book';

			it('should update book successfully', async () => {
				await adminSeeder(prisma);
				await bookSeeder(prisma, bookData);

				const token = await login(app);

				const book = await prisma.book.findFirst();

				const res = await request(app.getHttpServer())
					.patch(`${route}/${book?.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({
						title: 'Updated Title',
					})
					.expect(200);

				expect(res.body.message).toBe('Book updated successfully');

				const updated = await prisma.book.findUnique({
					where: { id: book?.id },
				});

				expect(updated?.title).toBe('Updated Title');
			});
		});

		describe('DELETE /api/book/:id', () => {
			const route = '/api/book';

			it('should delete book successfully', async () => {
				await adminSeeder(prisma);
				await bookSeeder(prisma, bookData);

				const token = await login(app);

				const book = await prisma.book.findFirst();

				const res = await request(app.getHttpServer())
					.delete(`${route}/${book?.id}`)
					.set('Authorization', `Bearer ${token}`)
					.expect(200);

				expect(res.body.message).toContain('deleted successfully');

				const deleted = await prisma.book.findUnique({
					where: { id: book?.id },
				});

				expect(deleted).toBeNull();
			});
		});
	});

	describe('fail cases', () => {
		describe('POST /api/book', () => {
			const route = '/api/book';

			it('should throw 401 if not authenticated', async () => {
				await request(app.getHttpServer())
					.post(route)
					.send({
						title: 'Test',
						author: 'Test',
						year: 2024,
						category: 'Programming',
						bookLocation: 'A-01',
					})
					.expect(401);
			});

			it('should throw 400 if validation fail', async () => {
				await adminSeeder(prisma);
				const token = await login(app);

				await request(app.getHttpServer())
					.post(route)
					.set('Authorization', `Bearer ${token}`)
					.send({
						title: '',
					})
					.expect(400);
			});
		});

		describe('PATCH /api/book/:id', () => {
			const route = '/api/book';

			it('should throw 401 if not authenticated', async () => {
				await bookSeeder(prisma, bookData);

				const book = await prisma.book.findFirst();

				await request(app.getHttpServer())
					.patch(`${route}/${book?.id}`)
					.send({ title: 'Updated Title' })
					.expect(401);

				const updated = await prisma.book.findUnique({
					where: { id: book?.id },
				});

				expect(updated?.title).not.toBe('Updated Title');
			});

			it('should throw 404 if book not found', async () => {
				await adminSeeder(prisma);

				const token = await login(app);

				await request(app.getHttpServer())
					.patch(`${route}/9999`)
					.set('Authorization', `Bearer ${token}`)
					.send({ title: 'Updated Title' })
					.expect(404);
			});

			it('should throw 400 if validation fail', async () => {
				await bookSeeder(prisma, bookData);
				await adminSeeder(prisma);

				const token = await login(app);

				const book = await prisma.book.findFirst();

				await request(app.getHttpServer())
					.patch(`${route}/${book?.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ title: '' })
					.expect(400);

				const updated = await prisma.book.findUnique({
					where: { id: book?.id },
				});

				expect(updated?.title).not.toBe('');
			});
		});

		describe('DELETE /api/book/:id', () => {
			const route = '/api/book';

			it('should throw 401 if not authenticated', async () => {
				await bookSeeder(prisma, bookData);

				const book = await prisma.book.findFirst();

				await request(app.getHttpServer()).delete(`${route}/${book?.id}`).expect(401);

				const deleted = await prisma.book.findUnique({
					where: { id: book?.id },
				});

				expect(deleted).not.toBeNull();
			});

			it('should throw 404 if book not found', async () => {
				await adminSeeder(prisma);

				const token = await login(app);

				await request(app.getHttpServer())
					.delete(`${route}/9999`)
					.set('Authorization', `Bearer ${token}`)
					.expect(404);
			});
		});
	});
});
