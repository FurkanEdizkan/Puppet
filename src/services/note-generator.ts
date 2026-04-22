import {normalizePath} from "obsidian";
import type {ContentMetadata, MovieMetadata, BookMetadata, AnimeMetadata, ResearchMetadata, GenericMetadata} from "../models/types";
import {Domain} from "../models/types";

type FieldValue = string | number | boolean | string[] | undefined | null;

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

		const addField = (key: string, value: string | number | boolean | string[] | undefined | null) => {
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
		addField("status", metadata.status);

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
			case Domain.Research:
				this.addResearchFields(metadata, addField);
				break;
			case Domain.Games:
			case Domain.Boardgames:
				this.addGenericFields(metadata, addField);
				break;
		}

		// Common trailing fields
		addField("cover", metadata.cover);
		addField("coverLink", metadata.coverLink);
		addField("source", metadata.source);
		addField("sourceId", metadata.sourceId);
		addField("tags", metadata.tags);
		addField("dateAdded", metadata.dateAdded);

		return lines.join("\n") + "\n";
	}

	private addMovieFields(
		metadata: MovieMetadata,
		addField: (key: string, value: FieldValue) => void,
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
		addField: (key: string, value: FieldValue) => void,
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
		addField: (key: string, value: FieldValue) => void,
	): void {
		addField("year", metadata.year);
		addField("episodes", metadata.episodes);
		addField("chapters", metadata.chapters);
		addField("airingStatus", metadata.airingStatus);
		addField("score", metadata.score);
		addField("genres", metadata.genres);
		addField("studios", metadata.studios);
		addField("aired", metadata.aired);
	}

	private addResearchFields(
		metadata: ResearchMetadata,
		addField: (key: string, value: FieldValue) => void,
	): void {
		addField("year", metadata.year);
		addField("authors", metadata.authors);
		addField("primaryCategory", metadata.primaryCategory);
		addField("categories", metadata.categories);
		addField("arxivId", metadata.arxivId);
		addField("doi", metadata.doi);
		addField("journalRef", metadata.journalRef);
		addField("comment", metadata.comment);
		addField("published", metadata.published);
		addField("updated", metadata.updated);
		addField("paperFile", metadata.paperFile);
		addField("paperLink", metadata.paperLink);
	}

	private addGenericFields(
		metadata: GenericMetadata,
		addField: (key: string, value: FieldValue) => void,
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
