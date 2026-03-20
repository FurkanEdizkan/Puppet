import {App, Modal, Setting} from "obsidian";
import type {ContentMetadata, MovieMetadata, BookMetadata, AnimeMetadata} from "../models/types";
import {Domain} from "../models/types";

/**
 * Modal that displays full details of a content item and lets
 * the user confirm before creating the note.
 */
export class DetailModal extends Modal {
	constructor(
		app: App,
		private readonly metadata: ContentMetadata,
		private readonly onConfirm: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClass("puppet-detail-modal");

		const meta = this.metadata;

		contentEl.createEl("h3", {text: meta.title});

		// Poster / cover preview
		const posterUrl = this.getPosterUrl();
		if (posterUrl) {
			const imgContainer = contentEl.createDiv({cls: "puppet-detail-poster"});
			const img = imgContainer.createEl("img");
			img.src = posterUrl;
			img.alt = meta.title;
		}

		// Info table
		const table = contentEl.createDiv({cls: "puppet-detail-info"});
		this.addRow(table, "Type", meta.type);
		if (meta.year) this.addRow(table, "Year", String(meta.year));

		if (meta.type === Domain.Movies || meta.type === Domain.Series) {
			this.addMovieDetails(table, meta);
		} else if (meta.type === Domain.Books) {
			this.addBookDetails(table, meta);
		} else if (meta.type === Domain.Anime || meta.type === Domain.Manga || meta.type === Domain.Manhwa) {
			this.addAnimeDetails(table, meta);
		}

		if (meta.tags && meta.tags.length > 0) {
			this.addRow(table, "Tags", meta.tags.join(", "));
		}

		// Description/plot
		const desc = this.getDescription();
		if (desc) {
			contentEl.createEl("h4", {text: "Description"});
			const descEl = contentEl.createEl("p", {cls: "puppet-detail-desc"});
			descEl.textContent = desc.length > 500 ? desc.substring(0, 500) + "..." : desc;
		}

		// Confirm / Cancel
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText("Create note")
				.setCta()
				.onClick(() => {
					this.onConfirm();
					this.close();
				}))
			.addButton(btn => btn
				.setButtonText("Cancel")
				.onClick(() => this.close()));
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private addMovieDetails(table: HTMLElement, meta: MovieMetadata): void {
		if (meta.director) this.addRow(table, "Director", meta.director);
		if (meta.actors) this.addRow(table, "Actors", meta.actors.join(", "));
		if (meta.genre) this.addRow(table, "Genre", meta.genre.join(", "));
		if (meta.runtime) this.addRow(table, "Runtime", meta.runtime);
		if (meta.imdbRating) this.addRow(table, "IMDb rating", meta.imdbRating);
		if (meta.rated) this.addRow(table, "Rated", meta.rated);
	}

	private addBookDetails(table: HTMLElement, meta: BookMetadata): void {
		if (meta.author) this.addRow(table, "Author", meta.author);
		if (meta.authors && meta.authors.length > 1) this.addRow(table, "Authors", meta.authors.join(", "));
		if (meta.publisher) this.addRow(table, "Publisher", meta.publisher);
		if (meta.pageCount) this.addRow(table, "Pages", String(meta.pageCount));
		if (meta.isbn) this.addRow(table, "ISBN", meta.isbn);
		if (meta.categories) this.addRow(table, "Categories", meta.categories.join(", "));
		if (meta.averageRating) this.addRow(table, "Rating", String(meta.averageRating));
		if (meta.language) this.addRow(table, "Language", meta.language);
	}

	private addAnimeDetails(table: HTMLElement, meta: AnimeMetadata): void {
		if (meta.episodes) this.addRow(table, "Episodes", String(meta.episodes));
		if (meta.chapters) this.addRow(table, "Chapters", String(meta.chapters));
		if (meta.status) this.addRow(table, "Status", meta.status);
		if (meta.score) this.addRow(table, "Score", String(meta.score));
		if (meta.genres) this.addRow(table, "Genres", meta.genres.join(", "));
		if (meta.studios) this.addRow(table, "Studios", meta.studios.join(", "));
		if (meta.aired) this.addRow(table, "Aired", meta.aired);
	}

	private addRow(container: HTMLElement, label: string, value: string): void {
		const row = container.createDiv({cls: "puppet-detail-row"});
		row.createEl("span", {text: label + ":", cls: "puppet-detail-label"});
		row.createEl("span", {text: value, cls: "puppet-detail-value"});
	}

	private getPosterUrl(): string | undefined {
		const meta = this.metadata;
		if (meta.type === Domain.Movies || meta.type === Domain.Series) {
			return meta.poster ?? meta.cover;
		}
		return meta.cover;
	}

	private getDescription(): string | undefined {
		const meta = this.metadata;
		if (meta.description) return meta.description;
		if (meta.type === Domain.Movies || meta.type === Domain.Series) {
			return meta.plot;
		}
		if (meta.type === Domain.Anime || meta.type === Domain.Manga || meta.type === Domain.Manhwa) {
			return meta.synopsis;
		}
		return undefined;
	}
}
