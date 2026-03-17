import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from '@/core/core.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { throttlerConstant } from '@/modules/auth/throttler/throttler.constant';
import { THROTTLER_ERROR_MSG } from '@/modules/auth/throttler/error-msg.constant';
import { PrismaService } from '@/common/prisma/prisma.service';
import { adminSeeder } from '$/seeds/models/admin/admin.seeder';

import type { TestingModule } from '@nestjs/testing';

describe('Throttler (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [
				CoreModule,

				ThrottlerModule.forRoot({
					throttlers: [
						{
							name: throttlerConstant.test.name,
							ttl: throttlerConstant.test.ttl,
							limit: throttlerConstant.test.limit,
						},
					],
					errorMessage: THROTTLER_ERROR_MSG,
				}),

				AuthModule,
			],
		}).compile();

		app = moduleFixture.createNestApplication();

		prisma = moduleFixture.get(PrismaService);

		app.setGlobalPrefix('api');

		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should throw 429 after limit reached', async () => {
		await adminSeeder(prisma);

		const server = app.getHttpServer();
		const route = '/api/auth/login';
		const body = {
			password: 'wrong-password',
		};

		await request(server).post(route).send(body).expect(401);
		await request(server).post(route).send(body).expect(401);
		await request(server).post(route).send(body).expect(429);
	});
});
