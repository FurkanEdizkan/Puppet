/**
 * Minimal mock of the Obsidian API for unit testing.
 * Only stubs the parts actually used by plugin source code.
 */

export class Plugin {
	app: App;
	manifest = {id: "puppet", name: "Puppet", version: "1.0.0"};
	addCommand(_cmd: unknown): void { /* stub */ }
	addSettingTab(_tab: unknown): void { /* stub */ }
	registerEvent(_event: unknown): void { /* stub */ }
	registerDomEvent(_el: unknown, _type: string, _cb: unknown): void { /* stub */ }
	registerInterval(_id: number): number { return _id; }
	async loadData(): Promise<unknown> { return null; }
	async saveData(_data: unknown): Promise<void> { /* stub */ }
}

export class App {
	vault = new Vault();
	workspace = new Workspace();
	metadataCache = new MetadataCache();
}

export class Vault {
	getAbstractFileByPath(_path: string): TFile | TFolder | null { return null; }
	async create(_path: string, _content: string): Promise<TFile> { return new TFile(); }
	async createBinary(_path: string, _data: ArrayBuffer): Promise<TFile> { return new TFile(); }
	async modify(_file: TFile, _content: string): Promise<void> { /* stub */ }
	async createFolder(_path: string): Promise<TFolder> { return new TFolder(); }
}

export class Workspace {
	getActiveFile(): TFile | null { return null; }
	onLayoutReady(cb: () => void): void { cb(); }
	async openLinkText(_link: string, _source: string, _newLeaf: boolean): Promise<void> { /* stub */ }
	on(_event: string, _cb: (...args: unknown[]) => void): EventRef { return {} as EventRef; }
}

export class MetadataCache {
	getFileCache(_file: TFile): { frontmatter?: Record<string, unknown> } | null { return null; }
}

export class TFile {
	path = "";
	basename = "";
	extension = "md";
	name = "";
}

export class TFolder {
	path = "";
	name = "";
}

export class Modal {
	app: App;
	contentEl = { empty: () => {}, addClass: () => {}, createEl: () => ({}), createDiv: () => ({}) };
	constructor(app: App) { this.app = app; }
	open(): void { /* stub */ }
	close(): void { /* stub */ }
}

export class PluginSettingTab {
	app: App;
	containerEl = { empty: () => {}, createEl: () => ({}) };
	constructor(app: App, _plugin: unknown) { this.app = app; }
}

export class Setting {
	settingEl = { addClass: () => {} };
	descEl = { createEl: () => ({}) };
	constructor(_el: unknown) {}
	setName(_name: string): this { return this; }
	setDesc(_desc: string): this { return this; }
	setHeading(): this { return this; }
	addText(_cb: (text: TextComponent) => void): this { return this; }
	addToggle(_cb: (toggle: ToggleComponent) => void): this { return this; }
	addDropdown(_cb: (dropdown: DropdownComponent) => void): this { return this; }
	addButton(_cb: (button: ButtonComponent) => void): this { return this; }
}

export class Notice {
	constructor(_message: string, _timeout?: number) { /* stub */ }
}

export interface EventRef {}

export interface TextComponent {
	inputEl: HTMLInputElement;
	setPlaceholder(p: string): TextComponent;
	setValue(v: string): TextComponent;
	onChange(cb: (v: string) => void): TextComponent;
}

export interface ToggleComponent {
	setValue(v: boolean): ToggleComponent;
	onChange(cb: (v: boolean) => void): ToggleComponent;
}

export interface DropdownComponent {
	addOption(value: string, display: string): DropdownComponent;
	setValue(v: string): DropdownComponent;
	onChange(cb: (v: string) => void): DropdownComponent;
}

export interface ButtonComponent {
	setButtonText(text: string): ButtonComponent;
	setCta(): ButtonComponent;
	onClick(cb: () => void): ButtonComponent;
}

export interface RequestUrlParam {
	url: string;
	headers?: Record<string, string>;
}

export interface RequestUrlResponse {
	status: number;
	json: unknown;
	text: string;
	arrayBuffer: ArrayBuffer;
}

export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export async function requestUrl(_params: RequestUrlParam): Promise<RequestUrlResponse> {
	return { status: 200, json: {}, text: "", arrayBuffer: new ArrayBuffer(0) };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	_delay: number,
	_immediate?: boolean,
): T {
	return fn;
}

export function stringifyYaml(obj: unknown): string {
	return JSON.stringify(obj, null, 2);
}
