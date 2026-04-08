import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './seed.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
	const logger = new Logger('SeederBootstrap');

	const app = await NestFactory.createApplicationContext(SeedModule);

	const seeder = app.get(SeederService);

	await seeder.run();

	await app.close();

	logger.log('Seeding finished');
}

bootstrap().catch((e) => {
	const logger = new Logger('SeederBootstrap');
	logger.error('Seeding failed', e.stack);
	process.exit(1);
});
