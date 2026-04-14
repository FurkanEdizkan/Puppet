import {ApiClient, PuppetApiError} from "../../services/api-client";
import type {MetadataProvider, SearchResult, ContentMetadata, ResearchMetadata} from "../../models/types";
import {Domain} from "../../models/types";

const API_BASE = "https://export.arxiv.org/api/query";

/**
 * arXiv metadata provider.
 * Uses the arXiv Atom API (free, no API key required).
 * Parses XML responses with the browser-native DOMParser.
 */
export class ArxivProvider implements MetadataProvider {
	readonly name = "arXiv";
	readonly domain = Domain.Research;

	private readonly client: ApiClient;

	constructor() {
		this.client = new ApiClient();
	}

	async search(query: string): Promise<SearchResult[]> {
		const url = `${API_BASE}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=20&sortBy=relevance`;
		const xml = await this.client.fetchText(url);
		const doc = new DOMParser().parseFromString(xml, "text/xml");

		const entries = doc.querySelectorAll("entry");
		const results: SearchResult[] = [];

		for (const entry of Array.from(entries)) {
			const title = this.getText(entry, "title")?.replace(/\s+/g, " ").trim();
			const id = this.getText(entry, "id");
			const published = this.getText(entry, "published");
			const summary = this.getText(entry, "summary")?.replace(/\s+/g, " ").trim();

			if (!title || !id) continue;

			// Filter out error entries
			if (title === "Error") continue;

			const arxivId = this.extractArxivId(id);
			const year = published ? new Date(published).getFullYear() : undefined;

			results.push({
				title,
				year,
				sourceId: arxivId,
				source: this.name,
				description: summary ? (summary.length > 200 ? summary.substring(0, 200) + "..." : summary) : undefined,
			});
		}

		return results;
	}

	async getDetails(sourceId: string): Promise<ContentMetadata> {
		const url = `${API_BASE}?id_list=${encodeURIComponent(sourceId)}`;
		const xml = await this.client.fetchText(url);
		const doc = new DOMParser().parseFromString(xml, "text/xml");

		const entry = doc.querySelector("entry");
		if (!entry) {
			throw new PuppetApiError(`Paper not found: ${sourceId}`, this.name);
		}

		const title = this.getText(entry, "title")?.replace(/\s+/g, " ").trim();
		if (!title || title === "Error") {
			const errMsg = this.getText(entry, "summary") ?? `Paper not found: ${sourceId}`;
			throw new PuppetApiError(errMsg, this.name);
		}

		const summary = this.getText(entry, "summary")?.replace(/\s+/g, " ").trim();
		const published = this.getText(entry, "published");
		const updated = this.getText(entry, "updated");
		const year = published ? new Date(published).getFullYear() : undefined;

		// Authors
		const authorEls = entry.querySelectorAll("author");
		const authors = Array.from(authorEls)
			.map(a => this.getText(a, "name"))
			.filter((n): n is string => !!n);

		// Categories
		const categoryEls = entry.querySelectorAll("category");
		const categories = Array.from(categoryEls)
			.map(c => c.getAttribute("term"))
			.filter((t): t is string => !!t && t.includes("."));

		// Primary category (arxiv namespace element)
		const primaryCategory = this.getArxivPrimaryCategory(entry) ?? categories[0];

		// DOI and journal ref (arxiv namespace extension elements)
		const doi = this.getArxivExtension(entry, "doi");
		const journalRef = this.getArxivExtension(entry, "journal_ref");
		const comment = this.getArxivExtension(entry, "comment");

		// Links: PDF and HTML
		const links = entry.querySelectorAll("link");
		let pdfUrl: string | undefined;
		let htmlUrl: string | undefined;
		for (const link of Array.from(links)) {
			const rel = link.getAttribute("rel");
			const linkTitle = link.getAttribute("title");
			const href = link.getAttribute("href");
			if (rel === "related" && linkTitle === "pdf" && href) {
				pdfUrl = href;
			}
		}
		// arXiv HTML format URL (experimental)
		const arxivId = this.extractArxivId(this.getText(entry, "id") ?? sourceId);
		htmlUrl = `https://arxiv.org/html/${arxivId}`;
		if (!pdfUrl) {
			pdfUrl = `https://arxiv.org/pdf/${arxivId}`;
		}

		// Build tags: primary category first, then remaining categories
		const tagSet = new Set<string>();
		if (primaryCategory) tagSet.add(primaryCategory);
		for (const cat of categories) tagSet.add(cat);
		const tags = Array.from(tagSet);

		const metadata: ResearchMetadata = {
			type: Domain.Research,
			title,
			year,
			description: summary,
			source: this.name,
			sourceId: arxivId,
			tags,
			dateAdded: new Date().toISOString().split("T")[0],
			authors,
			primaryCategory,
			categories,
			arxivId,
			doi,
			journalRef,
			comment,
			published: published ? published.split("T")[0] : undefined,
			updated: updated ? updated.split("T")[0] : undefined,
			pdfUrl,
			htmlUrl,
		};

		return metadata;
	}

	/** Extract text content from a child element. */
	private getText(parent: Element, tagName: string): string | undefined {
		const el = parent.querySelector(tagName);
		return el?.textContent?.trim() || undefined;
	}

	/** Extract the arXiv ID from an absolute URL like http://arxiv.org/abs/2301.12345v1 */
	private extractArxivId(idUrl: string): string {
		// Strip URL prefix and version suffix
		return idUrl
			.replace(/^https?:\/\/arxiv\.org\/abs\//, "")
			.replace(/v\d+$/, "");
	}

	/** Get the primary category from the arxiv:primary_category element. */
	private getArxivPrimaryCategory(entry: Element): string | undefined {
		// The element is in the arxiv namespace; try multiple selection strategies
		const el = entry.querySelector("primary_category")
			?? entry.getElementsByTagNameNS("http://arxiv.org/schemas/atom", "primary_category")[0];
		return el?.getAttribute("term") || undefined;
	}

	/** Get an arxiv namespace extension element value (doi, journal_ref, comment). */
	private getArxivExtension(entry: Element, localName: string): string | undefined {
		const el = entry.querySelector(localName)
			?? entry.getElementsByTagNameNS("http://arxiv.org/schemas/atom", localName)[0];
		return el?.textContent?.trim() || undefined;
	}
}
