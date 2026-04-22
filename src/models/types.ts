/**
 * Core domain and type definitions for the Puppet plugin.
 */

/** Content domains managed by the plugin. */
export enum Domain {
	Movies = "movies",
	Series = "series",
	Anime = "anime",
	Manga = "manga",
	Manhwa = "manhwa",
	Books = "books",
	Research = "research",
	Games = "games",
	Boardgames = "boardgames",
}

/** Maps each domain to its subfolder name inside the root managed folder. */
export const DOMAIN_FOLDERS: Record<Domain, string> = {
	[Domain.Movies]: "movies",
	[Domain.Series]: "series",
	[Domain.Anime]: "anime",
	[Domain.Manga]: "manga",
	[Domain.Manhwa]: "manhwa",
	[Domain.Books]: "books",
	[Domain.Research]: "research",
	[Domain.Games]: "games",
	[Domain.Boardgames]: "boardgames",
};

/** Metadata fields common to all content items. */
export interface BaseMetadata {
	type: Domain;
	title: string;
	year?: number;
	description?: string;
	status?: string;
	tags?: string[];
	cover?: string;
	coverLink?: string;
	source?: string;
	sourceId?: string;
	dateAdded?: string;
}

/** Status options grouped by domain category. */
const WATCH_STATUS = ["Unwatched", "Watching", "Watched"] as const;
const READ_STATUS = ["Unread", "Reading", "Read"] as const;
const PLAY_STATUS = ["Unplayed", "Playing", "Played"] as const;

/** Get the appropriate status options for a domain. */
export function getStatusOptions(domain: Domain): readonly string[] {
	switch (domain) {
		case Domain.Movies:
		case Domain.Series:
		case Domain.Anime:
			return WATCH_STATUS;
		case Domain.Books:
		case Domain.Manga:
		case Domain.Manhwa:
		case Domain.Research:
			return READ_STATUS;
		case Domain.Games:
		case Domain.Boardgames:
			return PLAY_STATUS;
		default:
			return WATCH_STATUS;
	}
}

/** Movie / Series metadata. */
export interface MovieMetadata extends BaseMetadata {
	type: Domain.Movies | Domain.Series;
	director?: string;
	actors?: string[];
	genre?: string[];
	imdbId?: string;
	imdbRating?: string;
	runtime?: string;
	plot?: string;
	language?: string;
	country?: string;
	poster?: string;
	rated?: string;
	released?: string;
	writer?: string;
	awards?: string;
	boxOffice?: string;
	totalSeasons?: string;
}

/** Book metadata. */
export interface BookMetadata extends BaseMetadata {
	type: Domain.Books;
	author?: string;
	authors?: string[];
	isbn?: string;
	publisher?: string;
	pageCount?: number;
	categories?: string[];
	averageRating?: number;
	language?: string;
}

/** Anime / Manga metadata. */
export interface AnimeMetadata extends BaseMetadata {
	type: Domain.Anime | Domain.Manga | Domain.Manhwa;
	episodes?: number;
	chapters?: number;
	airingStatus?: string;
	score?: number;
	genres?: string[];
	studios?: string[];
	aired?: string;
	synopsis?: string;
}

/** Research paper metadata (arXiv). */
export interface ResearchMetadata extends BaseMetadata {
	type: Domain.Research;
	authors?: string[];
	primaryCategory?: string;
	categories?: string[];
	arxivId?: string;
	doi?: string;
	journalRef?: string;
	comment?: string;
	published?: string;
	updated?: string;
	pdfUrl?: string;
	htmlUrl?: string;
	paperFile?: string;
	paperLink?: string;
}

/** Metadata for domains without a dedicated interface. */
export interface GenericMetadata extends BaseMetadata {
	type: Domain.Games | Domain.Boardgames;
	designer?: string;
	players?: string;
	playingTime?: string;
}

/** Union of all concrete metadata types. */
export type ContentMetadata =
	| MovieMetadata
	| BookMetadata
	| AnimeMetadata
	| ResearchMetadata
	| GenericMetadata;

/** A search result returned by a provider. */
export interface SearchResult {
	title: string;
	year?: number;
	sourceId: string;
	source: string;
	poster?: string;
	description?: string;
	type?: string;
}

/** Provider interface — every API adapter must implement this. */
export interface MetadataProvider {
	readonly name: string;
	readonly domain: Domain;

	/** Search for items by query string. */
	search(query: string): Promise<SearchResult[]>;

	/** Fetch full metadata for a specific item by its source ID. */
	getDetails(sourceId: string): Promise<ContentMetadata>;
}
