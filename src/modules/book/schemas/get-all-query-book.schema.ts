import { z } from 'zod';
import { filterQuery } from '@/common/validators/filter-query.validator';
import { sortQuery } from '@/common/validators/sort-query.validator';
import { clamp } from '@/common/lib/clamp';

export const getAllQueryBookSchema = z.strictObject({
	page: z.coerce
		.number()
		.transform((v) => Math.floor(v))
		.transform(clamp(1, Infinity))
		.default(1),
	limit: z.coerce
		.number()
		.transform((v) => Math.floor(v))
		.transform(clamp(1, 100))
		.default(20),

	createdAtSort: sortQuery,
	titleSort: sortQuery,
	authorSort: sortQuery,
	yearSort: sortQuery,
	publisherSort: sortQuery,
	categorySort: sortQuery,
	bookLocationSort: sortQuery,

	bookCategoryFilter: filterQuery,
	bookLocationFilter: filterQuery,
	titleFilter: filterQuery,
});
export type GetAllQueryBookDto = z.infer<typeof getAllQueryBookSchema>;
