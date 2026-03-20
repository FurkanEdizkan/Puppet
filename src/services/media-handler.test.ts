import {describe, it, expect} from "vitest";
import {MediaHandler} from "./media-handler";

describe("MediaHandler", () => {
	describe("coverFilename", () => {
		it("generates a lowercase underscore-separated filename", () => {
			expect(MediaHandler.coverFilename("Inception", 2010))
				.toBe("inception_2010.jpg");
		});

		it("uses the default jpg extension", () => {
			expect(MediaHandler.coverFilename("Test")).toBe("test.jpg");
		});

		it("uses a custom extension when provided", () => {
			expect(MediaHandler.coverFilename("Test", undefined, "png"))
				.toBe("test.png");
		});

		it("includes year when provided", () => {
			expect(MediaHandler.coverFilename("Movie", 2024, "webp"))
				.toBe("movie_2024.webp");
		});

		it("strips special characters", () => {
			expect(MediaHandler.coverFilename("What: The *Movie*?"))
				.toBe("what_the_movie.jpg");
		});

		it("collapses multiple spaces into single underscore", () => {
			expect(MediaHandler.coverFilename("A   B   C"))
				.toBe("a_b_c.jpg");
		});

		it("handles empty title", () => {
			expect(MediaHandler.coverFilename("")).toBe(".jpg");
		});

		it("does not append year when 0", () => {
			expect(MediaHandler.coverFilename("Test", 0)).toBe("test.jpg");
		});
	});
});
