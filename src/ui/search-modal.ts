import {App, Modal, Setting, Notice, debounce} from "obsidian";
import type {SearchResult} from "../models/types";
import {Domain} from "../models/types";
import {ProviderRegistry} from "../core/provider-registry";

/**
 * Modal for searching content by query.
 * Shows debounced results as the user types, then calls onSelect with the chosen result.
 */
export class SearchModal extends Modal {
	private resultsEl: HTMLElement;
	private inputEl: HTMLInputElement;
	private results: SearchResult[] = [];

	constructor(
		app: App,
		private readonly domain: Domain,
		private readonly registry: ProviderRegistry,
		private readonly onSelect: (result: SearchResult) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClass("puppet-search-modal");

		const provider = this.registry.getActive(this.domain);
		const providerName = provider?.name ?? "Unknown";

		contentEl.createEl("h3", {text: `Search ${this.domainLabel()} (${providerName})`});

		const setting = new Setting(contentEl)
			.setName("Search")
			.addText(text => {
				this.inputEl = text.inputEl;
				text.setPlaceholder(`Search for a ${this.domainLabel().toLowerCase()}...`);
				text.inputEl.addEventListener("input",
					debounce(() => this.performSearch(text.getValue()), 400, true)
				);
				// Focus the input
				setTimeout(() => text.inputEl.focus(), 50);
			});
		setting.settingEl.addClass("puppet-search-input");

		this.resultsEl = contentEl.createDiv({cls: "puppet-search-results"});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async performSearch(query: string): Promise<void> {
		if (!query.trim()) {
			this.resultsEl.empty();
			this.results = [];
			return;
		}

		this.resultsEl.empty();
		this.resultsEl.createEl("p", {text: "Searching...", cls: "puppet-search-loading"});

		try {
			this.results = await this.registry.search(this.domain, query.trim());
			this.renderResults();
		} catch (err) {
			this.resultsEl.empty();
			const msg = err instanceof Error ? err.message : "Search failed";
			this.resultsEl.createEl("p", {text: msg, cls: "puppet-search-error"});
		}
	}

	private renderResults(): void {
		this.resultsEl.empty();

		if (this.results.length === 0) {
			this.resultsEl.createEl("p", {text: "No results found.", cls: "puppet-search-empty"});
			return;
		}

		for (const result of this.results) {
			const item = this.resultsEl.createDiv({cls: "puppet-search-item"});

			if (result.poster) {
				const img = item.createEl("img", {cls: "puppet-search-poster"});
				img.src = result.poster;
				img.alt = result.title;
				img.width = 40;
				img.height = 56;
				img.onerror = () => img.remove();
			}

			const info = item.createDiv({cls: "puppet-search-info"});
			info.createEl("strong", {text: result.title});
			const details: string[] = [];
			if (result.year) details.push(String(result.year));
			if (result.type) details.push(result.type);
			if (details.length > 0) {
				info.createEl("span", {text: ` (${details.join(" · ")})`, cls: "puppet-search-meta"});
			}
			if (result.description) {
				info.createEl("p", {
					text: result.description.length > 120
						? result.description.substring(0, 120) + "..."
						: result.description,
					cls: "puppet-search-desc",
				});
			}

			item.addEventListener("click", () => {
				this.onSelect(result);
				this.close();
			});
		}
	}

	private domainLabel(): string {
		switch (this.domain) {
			case Domain.Movies: return "Movies";
			case Domain.Series: return "Series";
			case Domain.Anime: return "Anime";
			case Domain.Manga: return "Manga";
			case Domain.Manhwa: return "Manhwa";
			case Domain.Books: return "Books";
			case Domain.Games: return "Games";
			case Domain.Boardgames: return "Board games";
			default: return this.domain;
		}
	}
}
