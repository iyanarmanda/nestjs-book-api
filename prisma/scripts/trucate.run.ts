// NEVER RUN THIS ON REAL PRODUCTION

import 'config/env/development';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { trucateDatabase } from '$/helper/truncate';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('Start cleaning database...');

	await trucateDatabase(prisma);

	console.log('Database cleaning completed');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
