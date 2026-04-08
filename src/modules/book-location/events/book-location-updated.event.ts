import type { BookLocation } from '@/generated/prisma/client';

export class BookLocationUpdatedEvent {
	constructor(
		public readonly bookLocation: BookLocation & {
			bookIds: number[];
		},
	) {}
}
