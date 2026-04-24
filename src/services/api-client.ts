import {requestUrl, RequestUrlParam, RequestUrlResponse} from "obsidian";

/** Common error base for all Puppet errors. */
export class PuppetError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PuppetError";
	}
}

export class PuppetNetworkError extends PuppetError {
	constructor(message: string, public readonly statusCode?: number) {
		super(message);
		this.name = "PuppetNetworkError";
	}
}

export class PuppetApiError extends PuppetError {
	constructor(message: string, public readonly provider: string) {
		super(message);
		this.name = "PuppetApiError";
	}
}

export class PuppetRateLimitError extends PuppetError {
	constructor(public readonly retryAfterMs: number) {
		super(`Rate limited. Retry after ${retryAfterMs}ms.`);
		this.name = "PuppetRateLimitError";
	}
}

/**
 * Thin wrapper around Obsidian's `requestUrl` for consistent JSON and binary fetching.
 */
export class ApiClient {
	/** Fetch JSON from a URL. */
	async fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
		const params: RequestUrlParam = {url, headers};
		let response: RequestUrlResponse;
		try {
			response = await requestUrl(params);
		} catch {
			throw new PuppetNetworkError(
				`Could not connect to the server. Check your internet connection.`
			);
		}
		if (response.status < 200 || response.status >= 300) {
			if (response.status === 429) {
				throw new PuppetRateLimitError(1000);
			}
			if (response.status === 404) {
				throw new PuppetNetworkError(`Not found (HTTP 404).`, response.status);
			}
			throw new PuppetNetworkError(
				`Request failed (HTTP ${response.status}). Try again later.`,
				response.status
			);
		}
		return response.json as T;
	}

	/** Fetch binary data (for images). */
	async fetchBinary(url: string): Promise<ArrayBuffer> {
		let response: RequestUrlResponse;
		try {
			response = await requestUrl({url});
		} catch {
			throw new PuppetNetworkError(
				`Could not download file. Check your internet connection.`
			);
		}
		if (response.status < 200 || response.status >= 300) {
			if (response.status === 404) {
				throw new PuppetNetworkError(`File not found (HTTP 404).`, response.status);
			}
			throw new PuppetNetworkError(
				`Download failed (HTTP ${response.status}). Try again later.`,
				response.status
			);
		}
		return response.arrayBuffer;
	}

	/** Fetch raw text from a URL (for XML APIs). */
	async fetchText(url: string, headers?: Record<string, string>): Promise<string> {
		let response: RequestUrlResponse;
		try {
			response = await requestUrl({url, headers});
		} catch (err) {
			// Obsidian throws on non-2xx — extract status if available
			const status = (err as Record<string, unknown>)?.status;
			if (typeof status === "number") {
				if (status === 429) throw new PuppetRateLimitError(1000);
				if (status === 404) throw new PuppetNetworkError(`Not found (HTTP 404).`, status);
				throw new PuppetNetworkError(`Request failed (HTTP ${status}). Try again later.`, status);
			}
			throw new PuppetNetworkError(
				`Could not connect to the server. Check your internet connection.`
			);
		}
		if (response.status < 200 || response.status >= 300) {
			if (response.status === 429) {
				throw new PuppetRateLimitError(1000);
			}
			if (response.status === 404) {
				throw new PuppetNetworkError(`Not found (HTTP 404).`, response.status);
			}
			throw new PuppetNetworkError(
				`Request failed (HTTP ${response.status}). Try again later.`,
				response.status
			);
		}
		return response.text;
	}
}
