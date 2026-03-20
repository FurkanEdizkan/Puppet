import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, MovieMetadata} from "../../models/types";
import {Domain} from "../../models/types";

/** OMDb API response for search. */
interface OmdbSearchResponse {
	Search?: OmdbSearchItem[];
	totalResults?: string;
	Response: string;
	Error?: string;
}

interface OmdbSearchItem {
	Title: string;
	Year: string;
	imdbID: string;
	Type: string;
	Poster: string;
}

/** OMDb API response for detail. */
interface OmdbDetailResponse {
	Title: string;
	Year: string;
	Rated: string;
	Released: string;
	Runtime: string;
	Genre: string;
	Director: string;
	Writer: string;
	Actors: string;
	Plot: string;
	Language: string;
	Country: string;
	Awards: string;
	Poster: string;
	imdbRating: string;
	imdbID: string;
	Type: string;
	totalSeasons?: string;
	BoxOffice?: string;
	Response: string;
	Error?: string;
}

const OMDB_BASE = "https://www.omdbapi.com/";

export class OmdbProvider implements MetadataProvider {
	readonly name = "OMDb";
	readonly domain: Domain;

	private readonly client: ApiClient;

	constructor(private readonly apiKey: string, domain: Domain = Domain.Movies) {
		this.client = new ApiClient();
		this.domain = domain;
	}

	async search(query: string): Promise<SearchResult[]> {
		if (!this.apiKey) {
			throw new PuppetApiError("OMDb API key is not configured. Set it in Puppet settings.", this.name);
		}

		const url = `${OMDB_BASE}?apikey=${encodeURIComponent(this.apiKey)}&s=${encodeURIComponent(query)}`;
		const data = await this.client.fetchJson<OmdbSearchResponse>(url);

		if (data.Response === "False") {
			if (data.Error === "Movie not found!") return [];
			throw new PuppetApiError(`OMDb error: ${data.Error ?? "Unknown error"}`, this.name);
		}

		return (data.Search ?? []).map(item => ({
			title: item.Title,
			year: parseInt(item.Year) || undefined,
			sourceId: item.imdbID,
			source: this.name,
			poster: item.Poster !== "N/A" ? item.Poster : undefined,
			type: item.Type,
		}));
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		if (!this.apiKey) {
			throw new PuppetApiError("OMDb API key is not configured.", this.name);
		}

		const url = `${OMDB_BASE}?apikey=${encodeURIComponent(this.apiKey)}&i=${encodeURIComponent(sourceId)}&plot=full`;
		const data = await this.client.fetchJson<OmdbDetailResponse>(url);

		if (data.Response === "False") {
			throw new PuppetApiError(`OMDb error: ${data.Error ?? "Unknown error"}`, this.name);
		}

		const isSeries = data.Type === "series";
		const type = isSeries ? Domain.Series : Domain.Movies;

		const metadata: MovieMetadata = {
			type,
			title: data.Title,
			year: parseInt(data.Year) || undefined,
			director: this.na(data.Director),
			writer: this.na(data.Writer),
			actors: this.splitCsv(data.Actors),
			genre: this.splitCsv(data.Genre),
			rated: this.na(data.Rated),
			runtime: this.na(data.Runtime),
			released: this.na(data.Released),
			plot: this.na(data.Plot),
			description: this.na(data.Plot),
			language: this.na(data.Language),
			country: this.na(data.Country),
			awards: this.na(data.Awards),
			poster: data.Poster !== "N/A" ? data.Poster : undefined,
			imdbId: data.imdbID,
			imdbRating: this.na(data.imdbRating),
			boxOffice: this.na(data.BoxOffice),
			totalSeasons: isSeries ? this.na(data.totalSeasons) : undefined,
			source: this.name,
			sourceId: data.imdbID,
			tags: [type, ...(this.splitCsv(data.Genre) ?? []).map(g => g.toLowerCase().replace(/\s+/g, "-"))],
			dateAdded: new Date().toISOString().split("T")[0],
		};

		return metadata;
	}

	/** Convert OMDb "N/A" strings to undefined. */
	private na(value: string | undefined): string | undefined {
		return value && value !== "N/A" ? value : undefined;
	}

	/** Split a comma-separated string into a trimmed array. */
	private splitCsv(value: string | undefined): string[] | undefined {
		if (!value || value === "N/A") return undefined;
		return value.split(",").map(s => s.trim()).filter(Boolean);
	}
}
