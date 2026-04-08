import type { BookCategoryData } from './book-category.interface';
import type { BookLocationData } from './book-location.interface';

export type BookData = {
	title: string;
	author: string;
	year: number;
	publisher: string | null;
	description: string | null;
	bookCategory: BookCategoryData;
	bookLocation: BookLocationData;
};
