import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, BookMetadata} from "../../models/types";
import {Domain} from "../../models/types";

interface GoogleBooksSearchResponse {
	totalItems: number;
	items?: GoogleBooksVolume[];
}

interface GoogleBooksVolume {
	id: string;
	volumeInfo: {
		title: string;
		subtitle?: string;
		authors?: string[];
		publisher?: string;
		publishedDate?: string;
		description?: string;
		industryIdentifiers?: Array<{ type: string; identifier: string }>;
		pageCount?: number;
		categories?: string[];
		averageRating?: number;
		language?: string;
		imageLinks?: {
			smallThumbnail?: string;
			thumbnail?: string;
		};
	};
}

const API_BASE = "https://www.googleapis.com/books/v1/volumes";

export class GoogleBooksProvider implements MetadataProvider {
	readonly name = "Google Books";
	readonly domain = Domain.Books;

	private readonly client: ApiClient;

	constructor(private readonly apiKey: string) {
		this.client = new ApiClient();
	}

	async search(query: string): Promise<SearchResult[]> {
		let url = `${API_BASE}?q=${encodeURIComponent(query)}&maxResults=20`;
		if (this.apiKey) {
			url += `&key=${encodeURIComponent(this.apiKey)}`;
		}

		const data = await this.client.fetchJson<GoogleBooksSearchResponse>(url);

		if (!data.items || data.items.length === 0) return [];

		return data.items.map(item => ({
			title: item.volumeInfo.title,
			year: this.parseYear(item.volumeInfo.publishedDate),
			sourceId: item.id,
			source: this.name,
			poster: item.volumeInfo.imageLinks?.thumbnail,
			description: item.volumeInfo.authors?.join(", "),
			type: "book",
		}));
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		let url = `${API_BASE}/${encodeURIComponent(sourceId)}`;
		if (this.apiKey) {
			url += `?key=${encodeURIComponent(this.apiKey)}`;
		}

		const item = await this.client.fetchJson<GoogleBooksVolume>(url);
		if (!item || !item.volumeInfo) {
			throw new PuppetApiError(`Book not found: ${sourceId}`, this.name);
		}
		const info = item.volumeInfo;

		const isbn = this.extractIsbn(info.industryIdentifiers);

		const metadata: BookMetadata = {
			type: Domain.Books,
			title: info.title,
			year: this.parseYear(info.publishedDate),
			description: info.description ? this.stripHtml(info.description) : undefined,
			author: info.authors?.[0],
			authors: info.authors,
			isbn,
			publisher: info.publisher,
			pageCount: info.pageCount,
			categories: info.categories,
			averageRating: info.averageRating,
			language: info.language,
			cover: info.imageLinks?.thumbnail,
			source: this.name,
			sourceId: item.id,
			tags: [Domain.Books, ...(info.categories ?? []).map(c => c.toLowerCase().replace(/\s+/g, "-"))],
			dateAdded: new Date().toISOString().split("T")[0],
		};

		return metadata;
	}

	private parseYear(date: string | undefined): number | undefined {
		if (!date) return undefined;
		const year = parseInt(date.substring(0, 4));
		return isNaN(year) ? undefined : year;
	}

	private extractIsbn(identifiers: Array<{ type: string; identifier: string }> | undefined): string | undefined {
		if (!identifiers) return undefined;
		const isbn13 = identifiers.find(i => i.type === "ISBN_13");
		if (isbn13) return isbn13.identifier;
		const isbn10 = identifiers.find(i => i.type === "ISBN_10");
		return isbn10?.identifier;
	}

	private stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
	}
}
