import {normalizePath} from "obsidian";
import type {ContentMetadata, MovieMetadata, BookMetadata, AnimeMetadata, FinanceMetadata, GenericMetadata} from "../models/types";
import {Domain} from "../models/types";

/**
 * Generates markdown note content from metadata,
 * including YAML frontmatter and a body section.
 */
export class NoteGenerator {
	/** Build the full markdown string for a content item. */
	generate(metadata: ContentMetadata): string {
		const frontmatter = this.buildFrontmatter(metadata);
		const body = this.buildBody(metadata);
		return `---\n${frontmatter}---\n\n${body}`;
	}

	/** Derive a safe filename (no special chars) from a title. */
	static toFilename(title: string, year?: number): string {
		let name = title
			.replace(/[\\/:*?"<>|#^[\]]/g, "")
			.replace(/\s+/g, " ")
			.trim();
		if (year) {
			name += ` (${year})`;
		}
		return name;
	}

	/** Full path for a note given a domain folder root. */
	static notePath(domainFolder: string, title: string, year?: number): string {
		return normalizePath(
			`${domainFolder}/${NoteGenerator.toFilename(title, year)}.md`
		);
	}

	private buildFrontmatter(metadata: ContentMetadata): string {
		const lines: string[] = [];

		const addField = (key: string, value: unknown) => {
			if (value === undefined || value === null || value === "") return;
			if (Array.isArray(value)) {
				if (value.length === 0) return;
				lines.push(`${key}: [${value.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(", ")}]`);
			} else if (typeof value === "string") {
				lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
			} else {
				lines.push(`${key}: ${String(value)}`);
			}
		};

		addField("type", metadata.type);
		addField("title", metadata.title);

		// Domain-specific fields
		switch (metadata.type) {
			case Domain.Movies:
			case Domain.Series:
				this.addMovieFields(metadata, addField);
				break;
			case Domain.Books:
				this.addBookFields(metadata, addField);
				break;
			case Domain.Anime:
			case Domain.Manga:
			case Domain.Manhwa:
				this.addAnimeFields(metadata, addField);
				break;
			case Domain.Finance:
				this.addFinanceFields(metadata, addField);
				break;
			case Domain.Games:
			case Domain.Boardgames:
			case Domain.People:
			case Domain.Research:
				this.addGenericFields(metadata, addField);
				break;
		}

		// Common trailing fields
		addField("cover", metadata.cover);
		addField("source", metadata.source);
		addField("sourceId", metadata.sourceId);
		addField("tags", metadata.tags);
		addField("dateAdded", metadata.dateAdded);

		return lines.join("\n") + "\n";
	}

	private addMovieFields(
		metadata: MovieMetadata,
		addField: (key: string, value: unknown) => void,
	): void {
		addField("year", metadata.year);
		addField("director", metadata.director);
		addField("writer", metadata.writer);
		addField("actors", metadata.actors);
		addField("genre", metadata.genre);
		addField("rated", metadata.rated);
		addField("runtime", metadata.runtime);
		addField("released", metadata.released);
		addField("language", metadata.language);
		addField("country", metadata.country);
		addField("imdbId", metadata.imdbId);
		addField("imdbRating", metadata.imdbRating);
		addField("awards", metadata.awards);
		addField("boxOffice", metadata.boxOffice);
		if (metadata.type === Domain.Series) {
			addField("totalSeasons", metadata.totalSeasons);
		}
	}

	private addBookFields(
		metadata: BookMetadata,
		addField: (key: string, value: unknown) => void,
	): void {
		addField("author", metadata.author);
		addField("authors", metadata.authors);
		addField("year", metadata.year);
		addField("isbn", metadata.isbn);
		addField("publisher", metadata.publisher);
		addField("pageCount", metadata.pageCount);
		addField("categories", metadata.categories);
		addField("averageRating", metadata.averageRating);
		addField("language", metadata.language);
	}

	private addAnimeFields(
		metadata: AnimeMetadata,
		addField: (key: string, value: unknown) => void,
	): void {
		addField("year", metadata.year);
		addField("episodes", metadata.episodes);
		addField("chapters", metadata.chapters);
		addField("status", metadata.status);
		addField("score", metadata.score);
		addField("genres", metadata.genres);
		addField("studios", metadata.studios);
		addField("aired", metadata.aired);
	}

	private addFinanceFields(
		metadata: FinanceMetadata,
		addField: (key: string, value: unknown) => void,
	): void {
		addField("symbol", metadata.symbol);
		addField("assetType", metadata.assetType);
		addField("price", metadata.price);
		addField("change", metadata.change);
		addField("changePercent", metadata.changePercent);
		addField("currency", metadata.currency);
		addField("marketCap", metadata.marketCap);
	}

	private addGenericFields(
		metadata: GenericMetadata,
		addField: (key: string, value: unknown) => void,
	): void {
		addField("year", metadata.year);
		addField("designer", metadata.designer);
		addField("players", metadata.players);
		addField("playingTime", metadata.playingTime);
	}

	private buildBody(metadata: ContentMetadata): string {
		const sections: string[] = [];
		sections.push(`# ${metadata.title}\n`);

		// Cover image
		if (metadata.cover) {
			sections.push(`![cover](${metadata.cover})\n`);
		}

		// Description / plot / synopsis
		const desc = this.extractDescription(metadata);
		if (desc) {
			sections.push(`## Description\n\n${desc}\n`);
		}

		return sections.join("\n");
	}

	private extractDescription(metadata: ContentMetadata): string | undefined {
		if (metadata.description) return metadata.description;
		if (metadata.type === Domain.Movies || metadata.type === Domain.Series) {
			return metadata.plot;
		}
		if (metadata.type === Domain.Anime || metadata.type === Domain.Manga || metadata.type === Domain.Manhwa) {
			return metadata.synopsis;
		}
		return undefined;
	}
}
