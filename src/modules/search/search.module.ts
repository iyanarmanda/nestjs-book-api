import { Module } from '@nestjs/common';
import { MeilisearchService } from '@/common/search/meilisearch.service';
import { SearchService } from './search.service';
import { SearchListener } from './listeners/search.listener';

@Module({
	providers: [MeilisearchService, SearchService, SearchListener],
})
export class SearchModule {}
