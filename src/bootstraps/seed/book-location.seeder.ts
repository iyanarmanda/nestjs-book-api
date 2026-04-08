import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { bookLocationData } from './data/book-location.data';

@Injectable()
export class BookLocationSeeder {
	private readonly logger = new Logger(BookLocationSeeder.name);

	constructor(private readonly prisma: PrismaService) {}

	async run(): Promise<void> {
		const existing = await this.prisma.bookLocation.findFirst();

		if (existing) {
			this.logger.log('Book Locations already exist, skipping seed');
			return;
		}

		await this.prisma.bookLocation.createMany({ data: bookLocationData });

		this.logger.log('Book Locations seeded successfully');
	}
}
