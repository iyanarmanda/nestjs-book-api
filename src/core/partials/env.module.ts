import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: `.env.${process.env.NODE_ENV}`,
			isGlobal: true,
			validate: (env) => {
				const schema = z.object({
					PORT: z.preprocess((val) => (val ? Number(val) : undefined), z.number().default(3000)),
					NODE_ENV: z.enum(['production', 'development', 'test']).default('production'),

					DATABASE_URL: z.string(),

					ADMIN_PASSWORD: z.string(),
					PASSWORD_PEPPER: z.string(),
					PASSWORD_SALT_ROUNDS: z.preprocess(
						(val) => (val ? Number(val) : undefined),
						z.number().min(10),
					),

					JWT_SECRET: z.string(),

					DOTENV_CONFIG_QUIET: z.enum(['true', 'false']).default('true'),
				});
				return schema.parse(env);
			},
		}),
	],
})
export class EnvModule {}
