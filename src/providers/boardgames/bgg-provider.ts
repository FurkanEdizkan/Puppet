import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, GenericMetadata} from "../../models/types";
import {Domain} from "../../models/types";

const API_BASE = "https://api.geekdo.com/api";

interface BggSearchResponse {
	items: BggSearchItem[];
}

interface BggSearchItem {
	objecttype: string;
	objectid: string;
	name: string;
}

interface BggLinkItem {
	name: string;
	objectid: string;
}

interface BggItemResponse {
	item: {
		objectid: number;
		name: string;
		yearpublished: string;
		minplayers: string;
		maxplayers: string;
		minplaytime: string;
		maxplaytime: string;
		short_description: string;
		description: string;
		images?: {
			original?: string;
			thumb?: string;
		};
		links?: {
			boardgamecategory?: BggLinkItem[];
			boardgamedesigner?: BggLinkItem[];
		};
	};
}

export class BggProvider implements MetadataProvider {
	readonly name = "BoardGameGeek";
	readonly domain = Domain.Boardgames;

	private readonly client: ApiClient;
	private searchCache: Map<string, BggSearchItem> = new Map();

	constructor() {
		this.client = new ApiClient();
	}

	async search(query: string): Promise<SearchResult[]> {
		const url = `${API_BASE}/geekitems?nosession=1&objecttype=thing&subtype=boardgame&search=${encodeURIComponent(query)}`;
		const data = await this.client.fetchJson<BggSearchResponse>(url);

		if (!data.items || data.items.length === 0) return [];

		this.searchCache.clear();
		const results: SearchResult[] = [];

		for (const item of data.items.slice(0, 20)) {
			this.searchCache.set(String(item.objectid), item);
			results.push({
				title: item.name,
				sourceId: String(item.objectid),
				source: this.name,
				type: "boardgame",
			});
		}

		return results;
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		const url = `${API_BASE}/geekitems?nosession=1&objecttype=thing&objectid=${encodeURIComponent(sourceId)}`;
		const data = await this.client.fetchJson<BggItemResponse>(url);

		const item = data.item;
		if (!item) {
			throw new PuppetApiError(`Board game not found: ${sourceId}`, this.name);
		}

		const categories = item.links?.boardgamecategory?.map(c => c.name) ?? [];
		const designers = item.links?.boardgamedesigner?.map(d => d.name) ?? [];

		let description = item.short_description || item.description || "";
		// Strip HTML tags from description
		description = description.replace(/<[^>]*>/g, "");

		// Build players string
		let players: string | undefined;
		if (item.minplayers && item.maxplayers) {
			players = item.minplayers === item.maxplayers
				? item.minplayers
				: `${item.minplayers}-${item.maxplayers}`;
		}

		// Build playing time string
		let playingTime: string | undefined;
		if (item.minplaytime) {
			playingTime = item.minplaytime === item.maxplaytime
				? `${item.minplaytime} min`
				: `${item.minplaytime}-${item.maxplaytime} min`;
		}

		const year = item.yearpublished ? parseInt(item.yearpublished) || undefined : undefined;

		const metadata: GenericMetadata = {
			type: Domain.Boardgames,
			title: item.name,
			year,
			description,
			cover: item.images?.original ?? item.images?.thumb ?? undefined,
			source: this.name,
			sourceId,
			tags: [Domain.Boardgames, ...categories.map(c => c.toLowerCase().replace(/\s+/g, "-"))],
			dateAdded: new Date().toISOString().split("T")[0],
			designer: designers.length > 0 ? designers.join(", ") : undefined,
			players,
			playingTime,
		};

		return metadata;
	}
}
