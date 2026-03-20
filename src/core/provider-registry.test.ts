import {describe, it, expect, vi} from "vitest";
import {ProviderRegistry} from "./provider-registry";
import {Domain} from "../models/types";
import type {MetadataProvider, SearchResult, ContentMetadata} from "../models/types";

function createMockProvider(name: string, domain: Domain): MetadataProvider {
	return {
		name,
		domain,
		search: vi.fn(async (): Promise<SearchResult[]> => [
			{title: "Mock Result", sourceId: "mock-1", source: name},
		]),
		getDetails: vi.fn(async (): Promise<ContentMetadata> => ({
			type: domain as Domain.Games,
			title: "Mock Detail",
			source: name,
			sourceId: "mock-1",
		})),
	};
}

describe("ProviderRegistry", () => {
	describe("register", () => {
		it("registers a provider for a domain", () => {
			const registry = new ProviderRegistry();
			const provider = createMockProvider("TestProvider", Domain.Movies);
			registry.register(provider);
			expect(registry.getProviders(Domain.Movies)).toHaveLength(1);
			expect(registry.getProviders(Domain.Movies)[0]?.name).toBe("TestProvider");
		});

		it("prevents duplicate registration by name", () => {
			const registry = new ProviderRegistry();
			const provider1 = createMockProvider("TestProvider", Domain.Movies);
			const provider2 = createMockProvider("TestProvider", Domain.Movies);
			registry.register(provider1);
			registry.register(provider2);
			expect(registry.getProviders(Domain.Movies)).toHaveLength(1);
		});

		it("allows different providers for the same domain", () => {
			const registry = new ProviderRegistry();
			const provider1 = createMockProvider("Provider1", Domain.Movies);
			const provider2 = createMockProvider("Provider2", Domain.Movies);
			registry.register(provider1);
			registry.register(provider2);
			expect(registry.getProviders(Domain.Movies)).toHaveLength(2);
		});

		it("auto-sets first registered provider as active", () => {
			const registry = new ProviderRegistry();
			const provider = createMockProvider("TestProvider", Domain.Movies);
			registry.register(provider);
			expect(registry.getActive(Domain.Movies)?.name).toBe("TestProvider");
		});
	});

	describe("setActive / getActive", () => {
		it("switches the active provider", () => {
			const registry = new ProviderRegistry();
			const p1 = createMockProvider("P1", Domain.Books);
			const p2 = createMockProvider("P2", Domain.Books);
			registry.register(p1);
			registry.register(p2);
			registry.setActive(Domain.Books, "P2");
			expect(registry.getActive(Domain.Books)?.name).toBe("P2");
		});

		it("does not switch if provider name is unknown", () => {
			const registry = new ProviderRegistry();
			const p1 = createMockProvider("P1", Domain.Books);
			registry.register(p1);
			registry.setActive(Domain.Books, "NonExistent");
			expect(registry.getActive(Domain.Books)?.name).toBe("P1");
		});

		it("returns undefined if no provider registered", () => {
			const registry = new ProviderRegistry();
			expect(registry.getActive(Domain.Movies)).toBeUndefined();
		});
	});

	describe("getProviders", () => {
		it("returns empty array for unregistered domain", () => {
			const registry = new ProviderRegistry();
			expect(registry.getProviders(Domain.Finance)).toEqual([]);
		});
	});

	describe("search", () => {
		it("delegates to the active provider", async () => {
			const registry = new ProviderRegistry();
			const provider = createMockProvider("TestSearch", Domain.Anime);
			registry.register(provider);
			const results = await registry.search(Domain.Anime, "test query");
			expect(provider.search).toHaveBeenCalledWith("test query");
			expect(results).toHaveLength(1);
			expect(results[0]?.title).toBe("Mock Result");
		});

		it("throws if no provider registered for domain", async () => {
			const registry = new ProviderRegistry();
			await expect(registry.search(Domain.Finance, "test"))
				.rejects.toThrow('No provider registered for domain "finance".');
		});
	});

	describe("getDetails", () => {
		it("delegates to the active provider", async () => {
			const registry = new ProviderRegistry();
			const provider = createMockProvider("TestDetails", Domain.Games);
			registry.register(provider);
			const details = await registry.getDetails(Domain.Games, "game-123");
			expect(provider.getDetails).toHaveBeenCalledWith("game-123");
			expect(details.title).toBe("Mock Detail");
		});

		it("throws if no provider registered for domain", async () => {
			const registry = new ProviderRegistry();
			await expect(registry.getDetails(Domain.Finance, "id"))
				.rejects.toThrow('No provider registered for domain "finance".');
		});
	});
});
