import {describe, it, expect} from "vitest";
import {DEFAULT_SETTINGS} from "./settings";
import {Domain} from "./models/types";

describe("Settings", () => {
	describe("DEFAULT_SETTINGS", () => {
		it("has a root folder set to Puppet", () => {
			expect(DEFAULT_SETTINGS.rootFolder).toBe("Puppet");
		});

		it("has auto-download images enabled", () => {
			expect(DEFAULT_SETTINGS.autoDownloadImages).toBe(true);
		});

		it("has all domains enabled by default", () => {
			for (const domain of Object.values(Domain)) {
				expect(DEFAULT_SETTINGS.enabledDomains[domain]).toBe(true);
			}
		});

		it("has empty API keys by default", () => {
			expect(DEFAULT_SETTINGS.apiKeys.omdb).toBe("");
			expect(DEFAULT_SETTINGS.apiKeys.googleBooks).toBe("");
		});

		it("defaults book provider to google", () => {
			expect(DEFAULT_SETTINGS.bookProvider).toBe("google");
		});

		it("has enabledDomains for every Domain enum value", () => {
			const domainValues = Object.values(Domain);
			const enabledKeys = Object.keys(DEFAULT_SETTINGS.enabledDomains);
			for (const domain of domainValues) {
				expect(enabledKeys).toContain(domain);
			}
		});
	});
});
