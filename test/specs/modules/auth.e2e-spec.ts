import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CoreModule } from '@/core/core.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PrismaService } from '@/common/prisma/prisma.service';
import { trucateDatabase } from '$/helper/truncate';
import { adminSeeder } from '$/seeds/models/admin/admin.seeder';
import { login } from '#/helper/auth.helper';

import type { App } from 'supertest/types';
import type { TestingModule } from '@nestjs/testing';

async function newPasswordCheck(
	password: string,
	app: INestApplication,
	status: number,
): Promise<void> {
	await request(app.getHttpServer())
		.post('/api/auth/login')
		.send({
			password,
		})
		.expect(status);
}

describe('AuthModule (e2e)', () => {
	let app: INestApplication<App>;
	let prisma: PrismaService;
	let configService: ConfigService;

	let ADMIN_PASSWORD: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [CoreModule, AuthModule],
		})
			.overrideGuard(ThrottlerGuard)
			.useValue({
				canActive: () => true,
			})
			.compile();

		app = moduleFixture.createNestApplication();

		prisma = moduleFixture.get(PrismaService);
		configService = moduleFixture.get(ConfigService);

		app.setGlobalPrefix('api');

		ADMIN_PASSWORD = configService.getOrThrow<string>('ADMIN_PASSWORD');

		await app.init();
	});

	beforeEach(async () => {
		await trucateDatabase(prisma);
		await adminSeeder(prisma);
	});

	afterAll(async () => {
		await prisma.$disconnect();
		await app.close();
	});

	describe('success cases', () => {
		describe('POST /api/auth/login', () => {
			const route = '/api/auth/login';

			it('should login successfully', async () => {
				const res = await request(app.getHttpServer())
					.post(route)
					.send({
						password: ADMIN_PASSWORD,
					})
					.expect(201);

				expect(res.body.message).toBe('Login successfully');
				expect(res.body.payload).toBeDefined();
			});
		});

		describe('POST /api/auth/change-password', () => {
			const route = '/api/auth/change-password';

			it('should change password successfully', async () => {
				const token = await login(app);
				const newPassword = 'newPassword123';

				const res = await request(app.getHttpServer())
					.post(route)
					.set('Authorization', `Bearer ${token}`)
					.send({
						oldPassword: ADMIN_PASSWORD,
						newPassword,
					})
					.expect(201);

				expect(res.body.message).toBe('Password changed successfully');

				const admin = await prisma.admin.findFirst();

				expect(admin).toBeDefined();

				await Promise.all([
					newPasswordCheck(newPassword, app, 201),
					newPasswordCheck(ADMIN_PASSWORD, app, 401),
				]);
			});
		});

		describe('POST /api/auth/logout', () => {
			const route = '/api/auth/logout';

			it('should logout successfully', async () => {
				const token = await login(app);

				const res = await request(app.getHttpServer())
					.post(route)
					.set('Authorization', `Bearer ${token}`)
					.expect(201);

				expect(res.body.message).toBe('Logout successfully');
			});
		});
	});

	describe('fail cases', () => {
		describe('POST /api/auth/login', () => {
			const route = '/api/auth/login';

			it('should throw if password incorrect', async () => {
				const res = await request(app.getHttpServer())
					.post(route)
					.send({
						password: 'wrong-password',
					})
					.expect(401);

				expect(res.body.payload).not.toBeDefined();
			});

			it('should throw if validation fail', async () => {
				const res = await request(app.getHttpServer())
					.post(route)
					.send({
						password: '',
					})
					.expect(400);

				expect(res.body.payload).not.toBeDefined();
			});
		});

		describe('POST /api/auth/change-password', () => {
			const route = '/api/auth/change-password';

			it('should throw if old password incorrect', async () => {
				const token = await login(app);
				const newPassword = 'newPassword123';

				await request(app.getHttpServer())
					.post(route)
					.set('Authorization', `Bearer ${token}`)
					.send({
						oldPassword: 'wrongPassword',
						newPassword,
					})
					.expect(401);

				await Promise.all([
					newPasswordCheck(newPassword, app, 401),
					newPasswordCheck(ADMIN_PASSWORD, app, 201),
				]);
			});

			it('should throw if not authenticated', async () => {
				const newPassword = 'newPassword123';

				await request(app.getHttpServer())
					.post(route)
					.send({
						oldPassword: ADMIN_PASSWORD,
						newPassword,
					})
					.expect(401);

				await Promise.all([
					newPasswordCheck(newPassword, app, 401),
					newPasswordCheck(ADMIN_PASSWORD, app, 201),
				]);
			});

			it('should throw if validation fail', async () => {
				const token = await login(app);
				const newPassword = 'password';

				await request(app.getHttpServer())
					.post(route)
					.set('Authorization', `Bearer ${token}`)
					.send({
						oldPassword: ADMIN_PASSWORD,
						newPassword,
					})
					.expect(400);

				await Promise.all([
					newPasswordCheck(newPassword, app, 401),
					newPasswordCheck(ADMIN_PASSWORD, app, 201),
				]);
			});
		});
	});
});
