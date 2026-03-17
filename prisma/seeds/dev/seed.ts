// NEVER SEED THIS ON REAL PRODUCTION
// ONLY FOR DEVELOPMNET

import 'config/env/development';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { trucateDatabase } from '$/helper/truncate';
import { bookCategorySeeder } from '$/seeds/models/book-category/book-category.seeder';
import { bookLocationSeeder } from '$/seeds/models/book-location/book-location.seeder';
import { adminSeeder } from '$/seeds/models/admin/admin.seeder';
import { bookSeeder } from '$/seeds/models/book/book.seeder';
import { bookCategoryData } from '@/database/seeds/data/book-category.data';
import { bookLocationData } from '@/database/seeds/data/book-location.data';
import { bookFactory } from './book.factory';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
	console.log('Start dev seeding...');

	await trucateDatabase(prisma);

	await adminSeeder(prisma);
	await bookCategorySeeder(prisma, bookCategoryData);
	await bookLocationSeeder(prisma, bookLocationData);
	await bookSeeder(prisma, bookFactory);

	console.log('Dev seeding completed');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
