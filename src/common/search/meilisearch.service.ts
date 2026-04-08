import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MeiliSearch } from 'meilisearch';

import type { Index, RecordAny, Stats } from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
	private client: MeiliSearch;

	constructor(
		private configService: ConfigService,
		private readonly logger: PinoLogger,
	) {
		this.logger.setContext(MeilisearchService.name);
	}

	async onModuleInit() {
		await this.initializeClient();
	}

	private async initializeClient() {
		try {
			const host = this.configService.get<string>('MEILI_HOST');
			const port = this.configService.get<number>('MEILI_PORT');
			const key = this.configService.get<string>('MEILI_MASTER_KEY');

			const url = `${host}:${port}`;

			this.client = new MeiliSearch({
				host: url,
				apiKey: key,
			});

			await this.client.health();
			this.logger.info(`Connected to Meilisearch at ${url}`);
		} catch (err) {
			this.logger.error(
				{
					event: 'MEILISEARCH_INIT',
					action: 'CONNECT',
					success: false,
					error: err.message,
				},
				'Failed to connect to Meilisearch',
			);
		}
	}

	getClient(): MeiliSearch {
		return this.client;
	}

	index(indexName: string): Index<RecordAny> {
		return this.client.index(indexName);
	}

	async getStats(): Promise<Stats> {
		try {
			const stats = await this.client.getStats();
			return stats;
		} catch (err) {
			this.logger.error(`Failed to get stats: ${err.message}`);
			throw err;
		}
	}
}
