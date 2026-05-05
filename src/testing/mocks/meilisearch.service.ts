export const mockMeilisearchClient = {
	health: jest.fn(),
};

export const mockMeilisearchService = {
	onModuleInit: jest.fn(),
	getStats: jest.fn(),

	getClient: jest.fn().mockResolvedValue(mockMeilisearchClient),
};
