import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.test.ts",
				"src/__mocks__/**",
			],
			thresholds: {
				lines: 50,
			},
		},
	},
	resolve: {
		alias: {
			obsidian: new URL("src/__mocks__/obsidian.ts", import.meta.url).pathname,
		},
	},
});
