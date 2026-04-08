import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuthService } from '@/modules/auth/auth.service';

@Injectable()
export class AdminSeeder {
	private readonly logger = new Logger(AdminSeeder.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
	) {}

	async run(): Promise<void> {
		const existing = await this.prisma.admin.findFirst();

		if (existing) {
			this.logger.log('Admin already exist, skipping seed');
			return;
		}

		const ADMIN_PASSWORD = this.configService.getOrThrow<string>('ADMIN_PASSWORD');

		const hashedPassword = await this.authService.encryptPassword(ADMIN_PASSWORD);

		await this.prisma.admin.create({
			data: {
				password: hashedPassword,
			},
		});

		this.logger.warn('Seeding default admin account');
		this.logger.log('Admin seeded successfully');
	}
}
