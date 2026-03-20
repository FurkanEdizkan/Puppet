import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, BookMetadata} from "../../models/types";
import {Domain} from "../../models/types";

interface OpenLibrarySearchResponse {
	numFound: number;
	docs: OpenLibraryDoc[];
}

interface OpenLibraryDoc {
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	isbn?: string[];
	publisher?: string[];
	number_of_pages_median?: number;
	subject?: string[];
	cover_i?: number;
	language?: string[];
}

interface OpenLibraryWork {
	key: string;
	title: string;
	description?: string | { type: string; value: string };
	covers?: number[];
}

const SEARCH_BASE = "https://openlibrary.org/search.json";
const WORKS_BASE = "https://openlibrary.org";
const COVER_BASE = "https://covers.openlibrary.org/b/id";

export class OpenLibraryProvider implements MetadataProvider {
	readonly name = "Open Library";
	readonly domain = Domain.Books;

	private readonly client: ApiClient;
	private searchCache = new Map<string, OpenLibraryDoc>();

	constructor() {
		this.client = new ApiClient();
	}

	async search(query: string): Promise<SearchResult[]> {
		const fields = "key,title,author_name,first_publish_year,isbn,publisher,number_of_pages_median,subject,cover_i,language";
		const url = `${SEARCH_BASE}?q=${encodeURIComponent(query)}&limit=20&fields=${fields}`;

		const data = await this.client.fetchJson<OpenLibrarySearchResponse>(url);

		if (!data.docs || data.docs.length === 0) return [];

		this.searchCache.clear();
		for (const doc of data.docs) {
			this.searchCache.set(doc.key, doc);
		}

		return data.docs.map(doc => ({
			title: doc.title,
			year: doc.first_publish_year,
			sourceId: doc.key,
			source: this.name,
			poster: doc.cover_i ? `${COVER_BASE}/${doc.cover_i}-M.jpg` : undefined,
			description: doc.author_name?.join(", "),
			type: "book",
		}));
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		// Fetch work for description
		const workUrl = `${WORKS_BASE}${sourceId}.json`;
		let description: string | undefined;
		try {
			const work = await this.client.fetchJson<OpenLibraryWork>(workUrl);
			description = this.extractDescription(work.description);
		} catch {
			// Work fetch may fail; continue with search data
		}

		// Use cached search data for other fields
		const doc = this.searchCache.get(sourceId);

		const metadata: BookMetadata = {
			type: Domain.Books,
			title: doc?.title ?? sourceId,
			year: doc?.first_publish_year,
			description,
			author: doc?.author_name?.[0],
			authors: doc?.author_name,
			isbn: doc?.isbn?.[0],
			publisher: doc?.publisher?.[0],
			pageCount: doc?.number_of_pages_median,
			categories: doc?.subject?.slice(0, 10),
			language: doc?.language?.[0],
			cover: doc?.cover_i ? `${COVER_BASE}/${doc.cover_i}-L.jpg` : undefined,
			source: this.name,
			sourceId,
			tags: [Domain.Books, ...(doc?.subject?.slice(0, 5) ?? []).map(s => s.toLowerCase().replace(/\s+/g, "-"))],
			dateAdded: new Date().toISOString().split("T")[0],
		};

		return metadata;
	}

	private extractDescription(desc: string | { type: string; value: string } | undefined): string | undefined {
		if (!desc) return undefined;
		if (typeof desc === "string") return desc;
		if (typeof desc === "object" && "value" in desc) return desc.value;
		return undefined;
	}
}
