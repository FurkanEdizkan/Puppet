import {App, Modal} from "obsidian";
import {Domain} from "../models/types";

interface DomainOption {
	domain: Domain;
	label: string;
	emoji: string;
}

/**
 * Modal for selecting what type of content to add.
 * Displays available domains and calls onSelect when user chooses one.
 */
export class DomainSelectionModal extends Modal {
	private readonly domains: DomainOption[] = [
		{domain: Domain.Movies, label: "Movies", emoji: "🎬"},
		{domain: Domain.Series, label: "TV Series", emoji: "📺"},
		{domain: Domain.Books, label: "Books", emoji: "📚"},
		{domain: Domain.Anime, label: "Anime", emoji: "📖"},
		{domain: Domain.Manga, label: "Manga", emoji: "🗾"},
		{domain: Domain.Manhwa, label: "Manhwa", emoji: "🎨"},
		{domain: Domain.Games, label: "Games", emoji: "🎮"},
		{domain: Domain.Boardgames, label: "Board Games", emoji: "🎲"},
	];

	constructor(
		app: App,
		private readonly onSelect: (domain: Domain) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClass("puppet-domain-modal");

		contentEl.createEl("h2", {text: "What would you like to add?"});

		const listEl = contentEl.createDiv({cls: "puppet-domain-list"});

		for (const option of this.domains) {
			const item = listEl.createDiv({cls: "puppet-domain-item"});

			const button = item.createEl("button", {
				cls: "puppet-domain-button",
				text: option.label,
			});

			button.addEventListener("click", () => {
				this.onSelect(option.domain);
				this.close();
			});
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
