import type { Book } from '@/generated/prisma/client';

export class BookCreatedEvent {
	constructor(
		public readonly book: Book & {
			category: string;
			bookLocation: string;
		},
	) {}
}
