import {App, PluginSettingTab, Setting} from "obsidian";
import type Puppet from "./main";
import {Domain} from "./models/types";

export interface PuppetSettings {
	rootFolder: string;
	autoDownloadImages: boolean;

	/** Which domains are enabled. */
	enabledDomains: Record<Domain, boolean>;

	/** Provider selection per domain (when multiple providers exist). */
	bookProvider: "google" | "openlibrary";

	/** Preferred format for downloading research papers. */
	paperFormat: "pdf" | "html";

	/** API keys. */
	apiKeys: {
		omdb: string;
		googleBooks: string;
	};
}

export const DEFAULT_SETTINGS: PuppetSettings = {
	rootFolder: "Puppet",
	autoDownloadImages: true,
	enabledDomains: {
		[Domain.Movies]: true,
		[Domain.Series]: true,
		[Domain.Anime]: true,
		[Domain.Manga]: true,
		[Domain.Manhwa]: true,
		[Domain.Books]: true,
		[Domain.Research]: true,
		[Domain.Games]: true,
		[Domain.Boardgames]: true,
	},
	bookProvider: "google",
	paperFormat: "pdf",
	apiKeys: {
		omdb: "",
		googleBooks: "",
	},
};

/** Domain labels for display. */
const DOMAIN_LABELS: Record<Domain, string> = {
	[Domain.Movies]: "Movies",
	[Domain.Series]: "TV series",
	[Domain.Anime]: "Anime",
	[Domain.Manga]: "Manga",
	[Domain.Manhwa]: "Manhwa",
	[Domain.Books]: "Books",
	[Domain.Research]: "Research",
	[Domain.Games]: "Games",
	[Domain.Boardgames]: "Board games",
};

export class PuppetSettingTab extends PluginSettingTab {
	plugin: Puppet;

	constructor(app: App, plugin: Puppet) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// ── General ──────────────────────────────────────────────

		new Setting(containerEl)
			.setName("Root folder")
			.setDesc("Folder where Puppet stores all managed content.")
			.addText(text => text
				.setPlaceholder("Puppet")
				.setValue(this.plugin.settings.rootFolder)
				.onChange(async (value) => {
					this.plugin.settings.rootFolder = value.trim() || "Puppet";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Auto-download images")
			.setDesc("Automatically download cover images and posters.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoDownloadImages)
				.onChange(async (value) => {
					this.plugin.settings.autoDownloadImages = value;
					await this.plugin.saveSettings();
				}));

		// ── Enabled domains ──────────────────────────────────────
		new Setting(containerEl).setName("Enabled domains").setHeading();

		for (const domain of Object.values(Domain)) {
			new Setting(containerEl)
				.setName(DOMAIN_LABELS[domain])
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.enabledDomains[domain])
					.onChange(async (value) => {
						this.plugin.settings.enabledDomains[domain] = value;
						await this.plugin.saveSettings();
					}));
		}

		// ── Provider selection ───────────────────────────────────
		new Setting(containerEl).setName("Providers").setHeading();

		new Setting(containerEl)
			.setName("Book provider")
			.setDesc("Choose which API to use for book lookups.")
			.addDropdown(dropdown => dropdown
				.addOption("google", "Google Books")
				.addOption("openlibrary", "Open Library")
				.setValue(this.plugin.settings.bookProvider)
				.onChange(async (value) => {
					this.plugin.settings.bookProvider = value as "google" | "openlibrary";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Paper download format")
			.setDesc("Preferred format for downloading research papers from arXiv.")
			.addDropdown(dropdown => dropdown
				.addOption("pdf", "PDF")
				.addOption("html", "HTML (experimental)")
				.setValue(this.plugin.settings.paperFormat)
				.onChange(async (value) => {
					this.plugin.settings.paperFormat = value as "pdf" | "html";
					await this.plugin.saveSettings();
				}));

		// ── API keys ─────────────────────────────────────────────
		new Setting(containerEl).setName("API keys").setHeading();

		const apiKeyEntries: Array<{
			key: keyof PuppetSettings["apiKeys"];
			name: string;
			desc: string;
			url: string;
		}> = [
			{
				key: "omdb",
				name: "OMDb API key",
				desc: "Required for movie/series search via OMDb.",
				url: "https://www.omdbapi.com/apikey.aspx",
			},
			{
				key: "googleBooks",
				name: "Google Books API key",
				desc: "Optional for Google Books (works without key at lower rate limits).",
				url: "https://console.cloud.google.com/apis/library/books.googleapis.com",
			},
		];

		for (const entry of apiKeyEntries) {
			const setting = new Setting(containerEl)
				.setName(entry.name)
				.setDesc(entry.desc)
				.addText(text => text
					.setPlaceholder("Enter API key")
					.setValue(this.plugin.settings.apiKeys[entry.key])
					.onChange(async (value) => {
						this.plugin.settings.apiKeys[entry.key] = value.trim();
						await this.plugin.saveSettings();
					}));

			// Add a link to the API key signup page
			setting.descEl.createEl("br");
			setting.descEl.createEl("a", {
				text: "Get API key",
				href: entry.url,
			});
		}
	}
}
