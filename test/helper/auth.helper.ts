import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function login(app: INestApplication): Promise<string> {
	const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

	const res = await request(app.getHttpServer())
		.post('/api/auth/login')
		.send({ password: ADMIN_PASSWORD });

	const token = res.body.payload;

	return token;
}
