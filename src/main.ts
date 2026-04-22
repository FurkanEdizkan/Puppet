import {Notice, Plugin, TFile} from "obsidian";
import {DEFAULT_SETTINGS, PuppetSettings, PuppetSettingTab} from "./settings";
import {Domain} from "./models/types";
import type {ContentMetadata, ResearchMetadata, SearchResult} from "./models/types";
import {FolderManager} from "./services/folder-manager";
import {NoteGenerator} from "./services/note-generator";
import {MediaHandler} from "./services/media-handler";
import {ProviderRegistry} from "./core/provider-registry";
import {BaseGenerator} from "./core/base-generator";
import {OmdbProvider} from "./providers/movies/omdb-provider";
import {GoogleBooksProvider} from "./providers/books/google-books-provider";
import {OpenLibraryProvider} from "./providers/books/openlibrary-provider";
import {JikanProvider} from "./providers/anime/jikan-provider";
import {SteamProvider} from "./providers/games/steam-provider";
import {BggProvider} from "./providers/boardgames/bgg-provider";
import {ArxivProvider} from "./providers/research/arxiv-provider";
import {SearchModal} from "./ui/search-modal";
import {DetailModal} from "./ui/detail-modal";
import {DomainSelectionModal} from "./ui/domain-selection-modal";

export default class Puppet extends Plugin {
	settings: PuppetSettings;

	private folderManager: FolderManager;
	private noteGenerator: NoteGenerator;
	private mediaHandler: MediaHandler;
	private registry: ProviderRegistry;
	private baseGenerator: BaseGenerator;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize services
		this.folderManager = new FolderManager(this.app, this.settings.rootFolder);
		this.noteGenerator = new NoteGenerator();
		this.mediaHandler = new MediaHandler(this.app, this.folderManager.getMediaPath());
		this.registry = new ProviderRegistry();
		this.baseGenerator = new BaseGenerator(this.app, this.settings.rootFolder);

		// Register providers
		this.registerProviders();

		// Register commands
		this.registerCommands();

		// Settings tab
		this.addSettingTab(new PuppetSettingTab(this.app, this));

		// Ribbon icon for quick access to domain selection
		this.addRibbonIcon("plus-circle", "Add content", () => {
			new DomainSelectionModal(this.app, (domain) => {
				this.openSearchFlow(domain);
			}).open();
		});

		// Defer folder creation until vault is fully loaded
		this.app.workspace.onLayoutReady(async () => {
			await this.folderManager.ensureFolders();
		});
	}

	onunload(): void {
		// Cleanup handled by Obsidian's register* helpers
	}

	async loadSettings(): Promise<void> {
		const loaded = await this.loadData() as Partial<PuppetSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
		// Deep-merge nested objects that may be partially saved
		this.settings.enabledDomains = Object.assign(
			{}, DEFAULT_SETTINGS.enabledDomains, loaded?.enabledDomains
		);
		this.settings.apiKeys = Object.assign(
			{}, DEFAULT_SETTINGS.apiKeys, loaded?.apiKeys
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// Update services with new settings
		this.folderManager.setRootFolder(this.settings.rootFolder);
		this.mediaHandler.setMediaFolder(this.folderManager.getMediaPath());
		this.baseGenerator.setRootFolder(this.settings.rootFolder);
		// Re-register providers (API keys may have changed)
		this.registerProviders();
		// Ensure folders exist after possible root change
		await this.folderManager.ensureFolders();
	}

	// ── Provider Registration ────────────────────────────────────

	private registerProviders(): void {
		this.registry = new ProviderRegistry();

		// Movies / Series — OMDb handles both
		if (this.settings.apiKeys.omdb) {
			this.registry.register(new OmdbProvider(this.settings.apiKeys.omdb, Domain.Movies));
			this.registry.register(new OmdbProvider(this.settings.apiKeys.omdb, Domain.Series));
		}
		if (this.settings.movieProvider === "omdb") {
			this.registry.setActive(Domain.Movies, "OMDb");
			this.registry.setActive(Domain.Series, "OMDb");
		}

		// Books — Google Books or Open Library
		if (this.settings.bookProvider === "google") {
			this.registry.register(new GoogleBooksProvider(this.settings.apiKeys.googleBooks));
			this.registry.setActive(Domain.Books, "Google Books");
		} else {
			this.registry.register(new OpenLibraryProvider());
			this.registry.setActive(Domain.Books, "Open Library");
		}

		// Anime / Manga / Manhwa — Jikan (no API key required)
		this.registry.register(new JikanProvider(Domain.Anime));
		this.registry.setActive(Domain.Anime, "Jikan");
		this.registry.register(new JikanProvider(Domain.Manga));
		this.registry.setActive(Domain.Manga, "Jikan");
		this.registry.register(new JikanProvider(Domain.Manhwa));
		this.registry.setActive(Domain.Manhwa, "Jikan");

		// Games — Steam (no API key required)
		this.registry.register(new SteamProvider());
		this.registry.setActive(Domain.Games, "Steam");

		// Board games — BGG via api.geekdo.com (no API key required)
		this.registry.register(new BggProvider());
		this.registry.setActive(Domain.Boardgames, "BoardGameGeek");

		// Research papers — arXiv (no API key required)
		this.registry.register(new ArxivProvider());
		this.registry.setActive(Domain.Research, "arXiv");
	}

	// ── Commands ─────────────────────────────────────────────────

	private registerCommands(): void {
		this.addCommand({
			id: "add-movie",
			name: "Add movie",
			callback: () => this.openSearchFlow(Domain.Movies),
		});

		this.addCommand({
			id: "add-series",
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			name: "Add TV series",
			callback: () => this.openSearchFlow(Domain.Series),
		});

		this.addCommand({
			id: "add-book",
			name: "Add book",
			callback: () => this.openSearchFlow(Domain.Books),
		});

		this.addCommand({
			id: "add-anime",
			name: "Add anime",
			callback: () => this.openSearchFlow(Domain.Anime),
		});

		this.addCommand({
			id: "add-manga",
			name: "Add manga",
			callback: () => this.openSearchFlow(Domain.Manga),
		});

		this.addCommand({
			id: "add-manhwa",
			name: "Add manhwa",
			callback: () => this.openSearchFlow(Domain.Manhwa),
		});

		this.addCommand({
			id: "add-game",
			name: "Add game",
			callback: () => this.openSearchFlow(Domain.Games),
		});

		this.addCommand({
			id: "add-boardgame",
			name: "Add board game",
			callback: () => this.openSearchFlow(Domain.Boardgames),
		});

		this.addCommand({
			id: "add-research",
			name: "Add research paper",
			callback: () => this.openSearchFlow(Domain.Research),
		});

		this.addCommand({
			id: "refresh-metadata",
			name: "Refresh current note metadata",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (!file.path.startsWith(this.settings.rootFolder + "/")) return false;
				if (checking) return true;
				void this.refreshMetadata(file);
				return true;
			},
		});

		this.addCommand({
			id: "rebuild-folders",
			name: "Rebuild folder structure",
			callback: async () => {
				try {
					await this.folderManager.ensureFolders();
					new Notice("Folder structure verified.");
				} catch (err) {
					new Notice(`Failed to rebuild folders: ${err instanceof Error ? err.message : String(err)}`);
				}
			},
		});
	}

	// ── Search Flow ──────────────────────────────────────────────

	private openSearchFlow(domain: Domain): void {
		if (!this.settings.enabledDomains[domain]) {
			new Notice(`Domain "${domain}" is disabled. Enable it in settings.`);
			return;
		}

		const provider = this.registry.getActive(domain);
		if (!provider) {
			new Notice(`No provider configured for "${domain}". Add an API key in settings.`);
			return;
		}

		new SearchModal(this.app, domain, this.registry, (result) => {
			void this.handleSearchSelection(domain, result);
		}).open();
	}

	private async handleSearchSelection(domain: Domain, result: SearchResult): Promise<void> {
		try {
			new Notice(`Fetching details for "${result.title}"...`);
			const metadata = await this.registry.getDetails(domain, result.sourceId);

			new DetailModal(this.app, metadata, () => {
				void this.createNote(metadata);
			}).open();
		} catch (err) {
			new Notice(`Failed to fetch details: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	// ── Note Creation ────────────────────────────────────────────

	private async createNote(metadata: ContentMetadata): Promise<void> {
		try {
			const domainPath = this.folderManager.getDomainPath(metadata.type);

			// Ensure folder still exists (user may have deleted it manually)
			await this.folderManager.ensureFolders();

			const notePath = NoteGenerator.notePath(domainPath, metadata.title, metadata.year);

			if (this.folderManager.fileExists(notePath)) {
				new Notice(`Note already exists: ${notePath}`);
				return;
			}

			// Download cover image if enabled and available
			if (this.settings.autoDownloadImages) {
				const posterUrl = this.extractPosterUrl(metadata);
				if (posterUrl) {
					const imgFilename = MediaHandler.coverFilename(
						metadata.title,
						metadata.year,
						this.getExtensionFromUrl(posterUrl),
					);
					const savedPath = await this.mediaHandler.downloadImage(posterUrl, imgFilename);
					if (savedPath) {
						metadata.cover = savedPath;
						const vaultName = this.app.vault.getName();
						metadata.coverLink = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(savedPath)}`;
					}
				}
			}

			// Download research paper file if applicable
			if (metadata.type === Domain.Research) {
				const paperPath = await this.downloadResearchPaper(metadata);
				if (paperPath) {
					metadata.paperFile = paperPath;
					const vaultName = this.app.vault.getName();
					metadata.paperLink = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(paperPath)}`;
				}
			}

			// Generate note content
			const content = this.noteGenerator.generate(metadata);
			await this.app.vault.create(notePath, content);

			new Notice(`Created: ${notePath}`);

			// Open the newly created note
			const file = this.app.vault.getAbstractFileByPath(notePath);
			if (file) {
				await this.app.workspace.openLinkText(notePath, "", false);
			}
		} catch (err) {
			new Notice(`Failed to create note: ${err instanceof Error ? err.message : String(err)}`);
			console.error("Puppet: createNote error", err);
		}
	}

	// ── Refresh Metadata ─────────────────────────────────────────

	private async refreshMetadata(file: TFile): Promise<void> {
		try {
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			if (!frontmatter?.sourceId || !frontmatter?.source || !frontmatter?.type) {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				new Notice("This note does not have Puppet metadata to refresh.");
				return;
			}

			const domain = frontmatter.type as Domain;
			const sourceId = frontmatter.sourceId as string;

			new Notice(`Refreshing metadata for "${frontmatter.title ?? file.basename}"...`);
			const metadata = await this.registry.getDetails(domain, sourceId);

			// Preserve existing cover and coverLink if we already downloaded one
			if (frontmatter.cover) {
				metadata.cover = frontmatter.cover as string;
			}
			if (frontmatter.coverLink) {
				metadata.coverLink = frontmatter.coverLink as string;
			}

			// Preserve existing paper file and paperLink for research notes
			if (frontmatter.paperFile) {
				(metadata as ResearchMetadata).paperFile = frontmatter.paperFile as string;
			}
			if (frontmatter.paperLink) {
				(metadata as ResearchMetadata).paperLink = frontmatter.paperLink as string;
			}

			const newContent = this.noteGenerator.generate(metadata);
			await this.app.vault.modify(file, newContent);
			new Notice("Metadata refreshed.");
		} catch (err) {
			new Notice(`Failed to refresh: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	// ── Helpers ──────────────────────────────────────────────────

	private extractPosterUrl(metadata: ContentMetadata): string | undefined {
		if (metadata.type === Domain.Movies || metadata.type === Domain.Series) {
			return metadata.poster ?? metadata.cover;
		}
		return metadata.cover;
	}

	/** Download a research paper file (PDF or HTML) to the papers subfolder. */
	private async downloadResearchPaper(metadata: ResearchMetadata): Promise<string | undefined> {
		const ext = this.settings.paperFormat;
		const url = ext === "html" ? metadata.htmlUrl : metadata.pdfUrl;
		if (!url) return undefined;

		const arxivId = metadata.arxivId ?? metadata.sourceId ?? "unknown";
		const filename = `${arxivId.replace(/\//g, "_")}.${ext}`;
		const papersFolder = this.folderManager.getPapersPath();

		const savedPath = await this.mediaHandler.downloadPaper(url, filename, papersFolder);
		if (!savedPath) {
			new Notice(`Could not download paper file. The ${ext.toUpperCase()} format may not be available for this paper.`);
		}
		return savedPath;
	}

	private getExtensionFromUrl(url: string): string {
		try {
			const pathname = new URL(url).pathname;
			const ext = pathname.split(".").pop()?.toLowerCase();
			if (ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
				return ext;
			}
		} catch {
			// Invalid URL
		}
		return "jpg";
	}
}
