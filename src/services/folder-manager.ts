import {App, TFolder, normalizePath} from "obsidian";
import {Domain, DOMAIN_FOLDERS} from "../models/types";

/**
 * Manages the plugin's folder structure inside the vault.
 * Creates and verifies subfolders for each domain plus a media folder.
 */
export class FolderManager {
	constructor(
		private readonly app: App,
		private rootFolder: string,
	) {}

	/** Update the root folder path (e.g. after settings change). */
	setRootFolder(rootFolder: string): void {
		this.rootFolder = rootFolder;
	}

	/** Get the resolved root path. */
	getRootPath(): string {
		return normalizePath(this.rootFolder);
	}

	/** Get the media folder path. */
	getMediaPath(): string {
		return normalizePath(`${this.rootFolder}/media`);
	}

	/** Get the papers folder path (for research paper files). */
	getPapersPath(): string {
		return normalizePath(`${this.rootFolder}/${DOMAIN_FOLDERS[Domain.Research]}/papers`);
	}

	/** Get the subfolder path for a given domain. */
	getDomainPath(domain: Domain): string {
		return normalizePath(`${this.rootFolder}/${DOMAIN_FOLDERS[domain]}`);
	}

	/**
	 * Ensure the full folder tree exists. Safe to call multiple times —
	 * it never overwrites existing folders or files.
	 */
	async ensureFolders(): Promise<void> {
		await this.ensureFolder(this.getRootPath());
		await this.ensureFolder(this.getMediaPath());

		for (const domain of Object.values(Domain)) {
			await this.ensureFolder(this.getDomainPath(domain));
		}

		// Research paper files subfolder
		await this.ensureFolder(this.getPapersPath());
	}

	/** Create a single folder if it doesn't already exist. */
	async ensureFolder(path: string): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFolder) {
			return; // Already exists
		}
		if (existing) {
			return;
		}
		await this.app.vault.createFolder(path);
	}

	/** Check if a file already exists at the given path. */
	fileExists(path: string): boolean {
		return this.app.vault.getAbstractFileByPath(normalizePath(path)) !== null;
	}
}
