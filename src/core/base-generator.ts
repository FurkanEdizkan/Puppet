import {App, normalizePath, stringifyYaml} from "obsidian";
import {Domain, DOMAIN_FOLDERS} from "../models/types";

/** Column property definitions for the movies view. */
const MOVIE_VIEW_ORDER = [
	"year",
	"imdbRating",
	"director",
	"genre",
	"runtime",
	"rated",
	"tags",
	"dateAdded",
];

/** Display names for movie properties. */
const MOVIE_PROPERTIES: Record<string, string> = {
	year: "Year",
	imdbRating: "IMDb rating",
	director: "Director",
	genre: "Genre",
	runtime: "Runtime",
	rated: "Rated",
	tags: "Tags",
	dateAdded: "Date added",
};

/**
 * Generates Obsidian .base files using the correct YAML-based format.
 *
 * A .base file defines a database view over notes in folders. The format
 * uses YAML with top-level keys: views, filters, properties, formulas.
 * Obsidian auto-detects column types from frontmatter values.
 */
export class BaseGenerator {
	constructor(
		private readonly app: App,
		private rootFolder: string,
	) {}

	setRootFolder(rootFolder: string): void {
		this.rootFolder = rootFolder;
	}

	/**
	 * Create the movies .base file inside the movies folder.
	 * Idempotent — does not overwrite if it already exists.
	 */
	async ensureMoviesBase(): Promise<string> {
		const domainFolder = DOMAIN_FOLDERS[Domain.Movies];
		const filePath = normalizePath(`${this.rootFolder}/${domainFolder}/Movies.base`);

		if (this.app.vault.getAbstractFileByPath(filePath)) {
			return filePath;
		}

		const content = this.buildMoviesBase();
		await this.app.vault.create(filePath, content);
		return filePath;
	}

	/**
	 * Create the series .base file inside the series folder.
	 * Idempotent — does not overwrite if it already exists.
	 */
	async ensureSeriesBase(): Promise<string> {
		const domainFolder = DOMAIN_FOLDERS[Domain.Series];
		const filePath = normalizePath(`${this.rootFolder}/${domainFolder}/Series.base`);

		if (this.app.vault.getAbstractFileByPath(filePath)) {
			return filePath;
		}

		const content = this.buildSeriesBase();
		await this.app.vault.create(filePath, content);
		return filePath;
	}

	private buildMoviesBase(): string {
		const data = {
			filters: `file.inFolder("${this.rootFolder}/${DOMAIN_FOLDERS[Domain.Movies]}")`,
			views: [
				{
					type: "table",
					name: "Movies",
					order: MOVIE_VIEW_ORDER,
					sort: [{property: "dateAdded", direction: "DESC"}],
				},
			],
			properties: this.buildProperties(MOVIE_PROPERTIES),
		};
		return stringifyYaml(data);
	}

	private buildSeriesBase(): string {
		const seriesOrder = [...MOVIE_VIEW_ORDER, "totalSeasons"];
		const seriesProps = {...MOVIE_PROPERTIES, totalSeasons: "Seasons"};

		const data = {
			filters: `file.inFolder("${this.rootFolder}/${DOMAIN_FOLDERS[Domain.Series]}")`,
			views: [
				{
					type: "table",
					name: "Series",
					order: seriesOrder,
					sort: [{property: "dateAdded", direction: "DESC"}],
				},
			],
			properties: this.buildProperties(seriesProps),
		};
		return stringifyYaml(data);
	}

	private buildProperties(displayNames: Record<string, string>): Record<string, {displayName: string}> {
		const properties: Record<string, {displayName: string}> = {};
		for (const [key, name] of Object.entries(displayNames)) {
			properties[key] = {displayName: name};
		}
		return properties;
	}
}
