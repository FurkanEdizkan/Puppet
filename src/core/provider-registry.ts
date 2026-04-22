import type {MetadataProvider, SearchResult, ContentMetadata} from "../models/types";
import {Domain} from "../models/types";

/**
 * Registry that maps domains to their active providers.
 * Supports multiple providers per domain and allows runtime switching.
 */
export class ProviderRegistry {
	private providers = new Map<Domain, MetadataProvider[]>();
	private activeProvider = new Map<Domain, string>();

	/** Register a provider for a domain. */
	register(provider: MetadataProvider): void {
		const list = this.providers.get(provider.domain) ?? [];
		// Prevent duplicate registration
		if (!list.some(p => p.name === provider.name)) {
			list.push(provider);
		}
		this.providers.set(provider.domain, list);

		// If no active provider for this domain, set this one as active
		if (!this.activeProvider.has(provider.domain)) {
			this.activeProvider.set(provider.domain, provider.name);
		}
	}

	/** Set the active provider for a domain by name. */
	setActive(domain: Domain, providerName: string): void {
		const list = this.providers.get(domain);
		if (!list?.some(p => p.name === providerName)) {
			return;
		}
		this.activeProvider.set(domain, providerName);
	}

	/** Get the active provider for a domain. */
	getActive(domain: Domain): MetadataProvider | undefined {
		const name = this.activeProvider.get(domain);
		if (!name) return undefined;
		const list = this.providers.get(domain);
		return list?.find(p => p.name === name);
	}

	/** Get all registered providers for a domain. */
	getProviders(domain: Domain): MetadataProvider[] {
		return this.providers.get(domain) ?? [];
	}

	/** Search using the active provider for a domain. */
	async search(domain: Domain, query: string): Promise<SearchResult[]> {
		const provider = this.getActive(domain);
		if (!provider) {
			throw new Error(`No provider registered for domain "${domain}".`);
		}
		return provider.search(query);
	}

	/** Fetch details using the active provider for a domain. */
	async getDetails(domain: Domain, sourceId: string): Promise<ContentMetadata> {
		const provider = this.getActive(domain);
		if (!provider) {
			throw new Error(`No provider registered for domain "${domain}".`);
		}
		return provider.getDetails(sourceId);
	}
}
