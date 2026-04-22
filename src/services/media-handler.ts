import {App, normalizePath} from "obsidian";
import {ApiClient} from "./api-client";

/**
 * Downloads and manages media assets (cover images, posters).
 * Stores files in the media subfolder and deduplicates by filename.
 */
export class MediaHandler {
	private readonly apiClient: ApiClient;

	constructor(
		private readonly app: App,
		private mediaFolder: string,
	) {
		this.apiClient = new ApiClient();
	}

	/** Update the media folder path (if root folder changes). */
	setMediaFolder(mediaFolder: string): void {
		this.mediaFolder = mediaFolder;
	}

	/**
	 * Download an image from a URL and save it to the media folder.
	 * Returns the vault-relative path to the saved file, or undefined on failure.
	 * If a file with the same name already exists, returns the existing path (dedup).
	 */
	async downloadImage(url: string, filename: string): Promise<string | undefined> {
		const safeName = this.sanitizeFilename(filename);
		const filePath = normalizePath(`${this.mediaFolder}/${safeName}`);

		// Dedup: if file already exists, just return its path
		if (this.app.vault.getAbstractFileByPath(filePath)) {
			return filePath;
		}

		try {
			const data = await this.apiClient.fetchBinary(url);
			await this.app.vault.createBinary(filePath, data);
			return filePath;
		} catch {
			return undefined;
		}
	}

	/** Build a filename for a cover image with proper extension. */
	static coverFilename(title: string, year?: number, ext = "jpg"): string {
		let name = title
			.replace(/[\\/:*?"<>|#^[\]]/g, "")
			.replace(/\s+/g, "_")
			.toLowerCase()
			.trim();
		if (year) {
			name += `_${year}`;
		}
		return `${name}.${ext}`;
	}

	/**
	 * Download a paper file (PDF or HTML) and save it to the given folder.
	 * Returns the vault-relative path to the saved file, or undefined on failure.
	 */
	async downloadPaper(url: string, filename: string, papersFolder: string): Promise<string | undefined> {
		const safeName = this.sanitizeFilename(filename);
		const filePath = normalizePath(`${papersFolder}/${safeName}`);

		if (this.app.vault.getAbstractFileByPath(filePath)) {
			return filePath;
		}

		try {
			const data = await this.apiClient.fetchBinary(url);
			await this.app.vault.createBinary(filePath, data);
			return filePath;
		} catch {
			return undefined;
		}
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|#^[\]]/g, "")
			.replace(/\s+/g, "_")
			.trim();
	}
}
