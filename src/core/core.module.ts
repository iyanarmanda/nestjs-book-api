import { Module, Global } from '@nestjs/common';
import { EnvModule } from './partials/env.module';
import { LoggerModule } from './partials/logger.module';

@Global()
@Module({
	imports: [EnvModule, LoggerModule],
	exports: [EnvModule, LoggerModule],
})
export class CoreModule {}
