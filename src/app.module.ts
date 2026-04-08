import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/core.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookModule } from './modules/book/book.module';
import { BookLocationModule } from './modules/book-location/book-location.module';
import { BookCategoryModule } from './modules/book-category/book-category.module';
import { SearchModule } from './modules/search/search.module';

@Module({
	imports: [
		CoreModule,

		HealthModule,
		AuthModule,
		BookModule,
		BookLocationModule,
		BookCategoryModule,
		SearchModule,
	],
})
export class AppModule {}
