import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, GenericMetadata} from "../../models/types";
import {Domain} from "../../models/types";

interface SteamSearchResponse {
	total: number;
	items: SteamSearchItem[];
}

interface SteamSearchItem {
	type: string;
	name: string;
	id: number;
	tiny_image: string;
	metascore?: string;
}

interface SteamAppDetailsResponse {
	[appId: string]: {
		success: boolean;
		data?: {
			type: string;
			name: string;
			steam_appid: number;
			short_description: string;
			header_image: string;
			developers?: string[];
			publishers?: string[];
			genres?: Array<{ id: string; description: string }>;
			release_date?: { coming_soon: boolean; date: string };
			metacritic?: { score: number };
		};
	};
}

const SEARCH_URL = "https://store.steampowered.com/api/storesearch/";
const DETAILS_URL = "https://store.steampowered.com/api/appdetails";

export class SteamProvider implements MetadataProvider {
	readonly name = "Steam";
	readonly domain = Domain.Games;

	private readonly client: ApiClient;

	constructor() {
		this.client = new ApiClient();
	}

	async search(query: string): Promise<SearchResult[]> {
		const url = `${SEARCH_URL}?term=${encodeURIComponent(query)}&l=en&cc=US`;
		const data = await this.client.fetchJson<SteamSearchResponse>(url);

		if (!data.items || data.items.length === 0) return [];

		return data.items.map(item => ({
			title: item.name,
			sourceId: String(item.id),
			source: this.name,
			poster: item.tiny_image,
			type: item.type,
		}));
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		const url = `${DETAILS_URL}?appids=${encodeURIComponent(sourceId)}`;
		const response = await this.client.fetchJson<SteamAppDetailsResponse>(url);

		const entry = response[sourceId];
		if (!entry?.success || !entry.data) {
			throw new PuppetApiError(`Game not found: ${sourceId}`, this.name);
		}

		const data = entry.data;
		const genres = data.genres?.map(g => g.description) ?? [];

		const metadata: GenericMetadata = {
			type: Domain.Games,
			title: data.name,
			year: this.parseYear(data.release_date?.date),
			description: data.short_description,
			cover: data.header_image,
			source: this.name,
			sourceId: String(data.steam_appid),
			tags: [Domain.Games, ...genres.map(g => g.toLowerCase().replace(/\s+/g, "-"))],
			dateAdded: new Date().toISOString().split("T")[0],
		};

		return metadata;
	}

	private parseYear(dateStr: string | undefined): number | undefined {
		if (!dateStr) return undefined;
		// Steam dates are like "10 Oct, 2007" — year is the last token
		const match = dateStr.match(/\b(\d{4})\b/);
		return match?.[1] ? parseInt(match[1]) : undefined;
	}
}
