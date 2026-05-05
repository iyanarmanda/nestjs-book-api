// NEVER SEED THIS ON REAL PRODUCTION
// ONLY FOR LOCAL PRODUCTION OR STAGING

import 'config/env/production';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { trucateDatabase } from '$/helper/truncate';
import { bookCategorySeeder } from './book-category.seeder';
import { bookLocationSeeder } from './book-location.seeder';
import { bookSeeder } from './book.seeder';
import { adminSeeder } from '../models/admin/admin.seeder';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TOTAL = 100_000;

async function main(): Promise<void> {
	console.log('Start heavy seeding...');

	await trucateDatabase(prisma);

	const categoryMap = await bookCategorySeeder(prisma);
	const locationMap = await bookLocationSeeder(prisma);

	await Promise.all([adminSeeder(prisma), bookSeeder(prisma, categoryMap, locationMap, TOTAL)]);

	console.log('Heavy seeding completed');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
