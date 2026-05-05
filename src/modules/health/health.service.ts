import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

import type { HealthResponse } from './interfaces/response.interface';

@Injectable()
export class HealthService {
	constructor(private readonly prisma: PrismaService) {}

	private baseResponse(status: 'ok' | 'error', message?: string): HealthResponse {
		return {
			status,
			uptime: Math.floor(process.uptime()),
			timestamp: new Date().toISOString(),
			message,
		};
	}

	apiCheck(): HealthResponse {
		return this.baseResponse('ok');
	}

	async dbCheck(): Promise<HealthResponse> {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return this.baseResponse('ok');
		} catch (_err) {
			throw new ServiceUnavailableException(this.baseResponse('error', 'Database not reachable'));
		}
	}
}
