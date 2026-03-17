import { PrismaService } from '@/common/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { EnvModule } from '@/core/partials/env.module';
import { LoggerModule } from '@/core/partials/logger.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { SeederService } from './seeds/seeder.service';
import { AdminSeeder } from './seeds/admin.seeder';
import { BookLocationSeeder } from './seeds/book-location.seeder';
import { BookCategorySeeder } from './seeds/book-category.seeder';

@Module({
	imports: [EnvModule, LoggerModule, AuthModule],
	providers: [PrismaService, AdminSeeder, BookCategorySeeder, BookLocationSeeder, SeederService],
})
export class SeedModule {}
