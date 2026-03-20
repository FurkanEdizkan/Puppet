import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, AnimeMetadata} from "../../models/types";
import {Domain} from "../../models/types";

interface JikanSearchResponse {
	data: JikanItem[];
}

interface JikanDetailResponse {
	data: JikanItem;
}

interface JikanItem {
	mal_id: number;
	title: string;
	title_english?: string;
	year?: number;
	images: {
		jpg: {
			image_url: string;
			small_image_url: string;
			large_image_url: string;
		};
	};
	synopsis?: string;
	episodes?: number;
	chapters?: number;
	volumes?: number;
	status?: string;
	score?: number;
	type?: string;
	aired?: { from?: string; string?: string };
	published?: { from?: string; string?: string };
	genres?: Array<{ name: string }>;
	themes?: Array<{ name: string }>;
	demographics?: Array<{ name: string }>;
	studios?: Array<{ name: string }>;
	authors?: Array<{ name: string }>;
}

const JIKAN_BASE = "https://api.jikan.moe/v4";

export class JikanProvider implements MetadataProvider {
	readonly name = "Jikan";
	readonly domain: Domain;

	private readonly client: ApiClient;
	private readonly endpoint: "anime" | "manga";

	constructor(domain: Domain.Anime | Domain.Manga | Domain.Manhwa) {
		this.client = new ApiClient();
		this.domain = domain;
		this.endpoint = domain === Domain.Anime ? "anime" : "manga";
	}

	async search(query: string): Promise<SearchResult[]> {
		const url = `${JIKAN_BASE}/${this.endpoint}?q=${encodeURIComponent(query)}&limit=20`;
		const data = await this.client.fetchJson<JikanSearchResponse>(url);

		if (!data.data || data.data.length === 0) return [];

		return data.data.map(item => ({
			title: item.title_english ?? item.title,
			year: item.year ?? this.parseYearFromDate(item.aired?.from ?? item.published?.from),
			sourceId: String(item.mal_id),
			source: this.name,
			poster: item.images.jpg.large_image_url,
			description: item.synopsis?.substring(0, 150),
			type: item.type,
		}));
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		const url = `${JIKAN_BASE}/${this.endpoint}/${encodeURIComponent(sourceId)}`;
		const data = await this.client.fetchJson<JikanDetailResponse>(url);

		if (!data.data) {
			throw new PuppetApiError(`Item not found: ${sourceId}`, this.name);
		}

		return this.mapToMetadata(data.data);
	}

	private mapToMetadata(item: JikanItem): AnimeMetadata {
		const allGenres = [
			...(item.genres ?? []).map(g => g.name),
			...(item.themes ?? []).map(t => t.name),
		];

		const metadata: AnimeMetadata = {
			type: this.domain as Domain.Anime | Domain.Manga | Domain.Manhwa,
			title: item.title_english ?? item.title,
			year: item.year ?? this.parseYearFromDate(item.aired?.from ?? item.published?.from),
			description: item.synopsis,
			synopsis: item.synopsis,
			episodes: item.episodes,
			chapters: item.chapters,
			status: item.status,
			score: item.score,
			genres: allGenres.length > 0 ? allGenres : undefined,
			studios: item.studios?.map(s => s.name),
			aired: item.aired?.string ?? item.published?.string,
			cover: item.images.jpg.large_image_url,
			source: this.name,
			sourceId: String(item.mal_id),
			tags: [this.domain, ...allGenres.map(g => g.toLowerCase().replace(/\s+/g, "-"))],
			dateAdded: new Date().toISOString().split("T")[0],
		};

		return metadata;
	}

	private parseYearFromDate(dateStr: string | undefined): number | undefined {
		if (!dateStr) return undefined;
		const year = parseInt(dateStr.substring(0, 4));
		return isNaN(year) ? undefined : year;
	}
}
