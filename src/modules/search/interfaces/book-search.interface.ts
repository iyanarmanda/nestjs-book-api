export interface BookSearchDocument {
	id: number;
	title: string;
	author: string;
	year: number;
	publisher: string | null;
	description: string | null;
	category: string;
	categoryId: number;
	bookLocation: string;
	bookLocationId: number;
	createdAt: number;
}
