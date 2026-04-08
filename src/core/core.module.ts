import { Module, Global } from '@nestjs/common';
import { EnvModule } from './partials/env.module';
import { LoggerModule } from './partials/logger.module';
import { MeilisearchModule } from './partials/meilisearch.module';
import { EventEmitterConfigModule } from './partials/event-emitter.module';

@Global()
@Module({
	imports: [EnvModule, LoggerModule, MeilisearchModule, EventEmitterConfigModule],
	exports: [EnvModule, LoggerModule, MeilisearchModule, EventEmitterConfigModule],
})
export class CoreModule {}
