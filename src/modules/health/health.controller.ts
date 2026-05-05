import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

import type { HealthResponse } from './interfaces/response.interface';

@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Get()
	apiCheck(): HealthResponse {
		return this.healthService.apiCheck();
	}

	@Get('db')
	async dbCheck(): Promise<HealthResponse> {
		return this.healthService.dbCheck();
	}
}
