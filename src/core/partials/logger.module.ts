import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

@Module({
	imports: [
		PinoLoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const NODE_ENV = configService.get<string>('NODE_ENV', 'production');
				const isDev = NODE_ENV === 'development';

				return {
					pinoHttp: {
						level: isDev ? 'debug' : 'info',

						transport: isDev
							? {
									target: 'pino-pretty',
									options: {
										singleLine: true,
										colorize: true,
										translateTime: 'HH:MM:ss',
									},
								}
							: {
									target: 'pino/file',
									options: {
										destination: './logs/app.log',
										mkdir: true,
									},
								},
						// : undefined,

						redact: {
							paths: [
								'req.headers.authorization',
								'req.headers.cookie',
								'req.body.password',
								'req.body.accessToken',
								'req.body.refreshToken',
							],
							remove: true,
						},

						genReqId: (req) => req.headers['x-request-id'] || randomUUID(),

						autoLogging: {
							ignore: (req) => req.method === 'GET',
						},

						customLogLevel: (_req, res, err) => {
							if (res.statusCode >= 500 || err) return 'error';
							if (res.statusCode >= 400) return 'warn';
							return 'info';
						},

						serializers: {
							req(req) {
								return {
									id: req.id,
									method: req.method,
									url: req.url,
									remoteAddress: req.remoteAddress,
								};
							},
						},
					},
				};
			},
		}),
	],
})
export class LoggerModule {}
