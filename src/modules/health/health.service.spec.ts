import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { HealthService } from './health.service';

import { mockPrisma } from 'mocks/@/generated/prisma/client';

describe('HealthService', () => {
	let service: HealthService;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [HealthService, { provide: PrismaService, useValue: mockPrisma }],
		}).compile();

		service = module.get<HealthService>(HealthService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('success cases', () => {
		// api check
		describe('apiCheck', () => {
			it('should return response of api health', () => {
				const result = service.apiCheck();

				expect(result).toMatchObject({
					status: 'ok',
				});

				expect(result.uptime).toBeDefined();
				expect(result.timestamp).toBeDefined();
			});
		});

		// db check
		describe('dbCheck', () => {
			it('should return response of database health', async () => {
				mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

				const result = await service.dbCheck();

				expect(mockPrisma.$queryRaw).toHaveBeenCalled();
				expect(result).toMatchObject({
					status: 'ok',
				});
			});
		});
	});

	describe('fail cases', () => {
		// db check
		describe('dbCheck', () => {
			it('should throw ServiceUnavaibleException when database fails', async () => {
				mockPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));

				const result = service.dbCheck();

				expect(mockPrisma.$queryRaw).toHaveBeenCalled();
				await expect(result).rejects.toThrow(ServiceUnavailableException);
				await expect(result).rejects.toMatchObject({
					response: {
						message: 'Database not reachable',
					},
				});
			});
		});
	});
});
