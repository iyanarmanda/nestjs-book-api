import { Injectable } from '@nestjs/common';
import { AdminSeeder } from './admin.seeder';
import { BookLocationSeeder } from './book-location.seeder';
import { BookCategorySeeder } from './book-category.seeder';

@Injectable()
export class SeederService {
	constructor(
		private readonly adminSeeder: AdminSeeder,
		private readonly bookCategorySeeder: BookCategorySeeder,
		private readonly bookLocationSeeder: BookLocationSeeder,
	) {}

	async run(): Promise<void> {
		await this.adminSeeder.run();
		await this.bookCategorySeeder.run();
		await this.bookLocationSeeder.run();
	}
}
