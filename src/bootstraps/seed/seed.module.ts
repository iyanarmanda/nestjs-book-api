import { PrismaService } from '@/common/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { EnvModule } from '@/core/partials/env.module';
import { LoggerModule } from '@/core/partials/logger.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { SeederService } from './seeder.service';
import { AdminSeeder } from './admin.seeder';
import { BookLocationSeeder } from './book-location.seeder';
import { BookCategorySeeder } from './book-category.seeder';

@Module({
	imports: [EnvModule, LoggerModule, AuthModule],
	providers: [PrismaService, AdminSeeder, BookCategorySeeder, BookLocationSeeder, SeederService],
})
export class SeedModule {}
