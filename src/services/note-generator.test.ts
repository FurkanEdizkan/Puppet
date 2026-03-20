import {describe, it, expect} from "vitest";
import {NoteGenerator} from "./note-generator";
import {Domain} from "../models/types";
import type {MovieMetadata, BookMetadata, AnimeMetadata, GenericMetadata} from "../models/types";

describe("NoteGenerator", () => {
	describe("toFilename", () => {
		it("returns the title unchanged when no special chars", () => {
			expect(NoteGenerator.toFilename("Inception")).toBe("Inception");
		});

		it("strips special characters", () => {
			expect(NoteGenerator.toFilename("What: The *Movie*?")).toBe("What The Movie");
		});

		it("collapses multiple spaces into one", () => {
			expect(NoteGenerator.toFilename("A   B   C")).toBe("A B C");
		});

		it("trims leading/trailing whitespace", () => {
			expect(NoteGenerator.toFilename("  Hello  ")).toBe("Hello");
		});

		it("appends year in parentheses when provided", () => {
			expect(NoteGenerator.toFilename("Inception", 2010)).toBe("Inception (2010)");
		});

		it("does not append year when undefined", () => {
			expect(NoteGenerator.toFilename("Inception")).toBe("Inception");
		});

		it("does not append year when 0", () => {
			expect(NoteGenerator.toFilename("Inception", 0)).toBe("Inception");
		});

		it("handles empty string", () => {
			expect(NoteGenerator.toFilename("")).toBe("");
		});
	});

	describe("notePath", () => {
		it("combines folder, sanitized title, and .md extension", () => {
			const result = NoteGenerator.notePath("Puppet/movies", "Inception", 2010);
			expect(result).toBe("Puppet/movies/Inception (2010).md");
		});

		it("normalizes slashes", () => {
			const result = NoteGenerator.notePath("Puppet//movies", "Test");
			expect(result).toBe("Puppet/movies/Test.md");
		});
	});

	describe("generate", () => {
		const gen = new NoteGenerator();

		it("produces YAML frontmatter wrapped in ---", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
				year: 2010,
				source: "omdb",
				sourceId: "tt1375666",
			};
			const result = gen.generate(metadata);
			expect(result).toMatch(/^---\n/);
			expect(result).toMatch(/\n---\n\n/);
		});

		it("includes type and title fields in frontmatter", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
				year: 2010,
			};
			const result = gen.generate(metadata);
			expect(result).toContain('type: "movies"');
			expect(result).toContain('title: "Inception"');
		});

		it("includes movie-specific fields", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
				year: 2010,
				director: "Christopher Nolan",
				genre: ["Sci-Fi", "Thriller"],
				imdbRating: "8.8",
			};
			const result = gen.generate(metadata);
			expect(result).toContain('director: "Christopher Nolan"');
			expect(result).toContain('genre: ["Sci-Fi", "Thriller"]');
			expect(result).toContain('imdbRating: "8.8"');
		});

		it("includes book-specific fields", () => {
			const metadata: BookMetadata = {
				type: Domain.Books,
				title: "Dune",
				author: "Frank Herbert",
				isbn: "978-0441172719",
				pageCount: 688,
			};
			const result = gen.generate(metadata);
			expect(result).toContain('author: "Frank Herbert"');
			expect(result).toContain("pageCount: 688");
		});

		it("includes anime-specific fields", () => {
			const metadata: AnimeMetadata = {
				type: Domain.Anime,
				title: "Steins;Gate",
				episodes: 24,
				score: 9.1,
				genres: ["Sci-Fi", "Thriller"],
			};
			const result = gen.generate(metadata);
			expect(result).toContain("episodes: 24");
			expect(result).toContain("score: 9.1");
		});

		it("includes generic domain fields", () => {
			const metadata: GenericMetadata = {
				type: Domain.Games,
				title: "Portal 2",
				year: 2011,
			};
			const result = gen.generate(metadata);
			expect(result).toContain('title: "Portal 2"');
			expect(result).toContain("year: 2011");
		});

		it("skips undefined and empty string values", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Test",
				director: "",
				writer: undefined,
			};
			const result = gen.generate(metadata);
			expect(result).not.toContain("director:");
			expect(result).not.toContain("writer:");
		});

		it("skips empty arrays", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Test",
				genre: [],
				actors: [],
			};
			const result = gen.generate(metadata);
			expect(result).not.toContain("genre:");
			expect(result).not.toContain("actors:");
		});

		it("escapes quotes in string values", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: 'She said "hello"',
			};
			const result = gen.generate(metadata);
			expect(result).toContain('title: "She said \\"hello\\""');
		});

		it("includes body with title heading", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
			};
			const result = gen.generate(metadata);
			expect(result).toContain("# Inception");
		});

		it("includes cover image in body when present", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
				cover: "media/inception_2010.jpg",
			};
			const result = gen.generate(metadata);
			expect(result).toContain("![cover](media/inception_2010.jpg)");
		});

		it("includes description section for movies with plot", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
				plot: "A thief who steals secrets through dreams.",
			};
			const result = gen.generate(metadata);
			expect(result).toContain("## Description");
			expect(result).toContain("A thief who steals secrets through dreams.");
		});

		it("includes totalSeasons for series", () => {
			const metadata: MovieMetadata = {
				type: Domain.Series,
				title: "Breaking Bad",
				totalSeasons: "5",
			};
			const result = gen.generate(metadata);
			expect(result).toContain('totalSeasons: "5"');
		});

		it("does not include totalSeasons for movies", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Inception",
				totalSeasons: "5",
			};
			const result = gen.generate(metadata);
			expect(result).not.toContain("totalSeasons");
		});

		it("includes tags as array", () => {
			const metadata: MovieMetadata = {
				type: Domain.Movies,
				title: "Film",
				tags: ["sci-fi", "action"],
			};
			const result = gen.generate(metadata);
			expect(result).toContain('tags: ["sci-fi", "action"]');
		});
	});
});
