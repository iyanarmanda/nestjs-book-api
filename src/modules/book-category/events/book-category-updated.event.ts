import type { BookCategory } from '@/generated/prisma/client';

export class BookCategoryUpdatedEvent {
	constructor(
		public readonly bookCategory: BookCategory & {
			bookIds: number[];
		},
	) {}
}
