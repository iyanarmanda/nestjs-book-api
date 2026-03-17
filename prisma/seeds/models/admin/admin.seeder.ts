import 'config/env';
import { hash } from 'bcrypt';

import type { PrismaClient } from '@/generated/prisma/client';

export async function adminSeeder(prisma: PrismaClient): Promise<void> {
	const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
	const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER;
	const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS);

	if (!ADMIN_PASSWORD || !PASSWORD_PEPPER || !PASSWORD_SALT_ROUNDS) {
		throw new Error('Missing required env variables for admin seeder');
	}

	const hashedPassword = await hash(ADMIN_PASSWORD + PASSWORD_PEPPER, PASSWORD_SALT_ROUNDS);

	await prisma.admin.create({
		data: {
			password: hashedPassword,
		},
	});

	return;
}
