import {App, normalizePath} from "obsidian";

/**
 * Generates the API_SETUP.md guide with instructions on obtaining
 * API keys for all supported providers.
 */
export class ApiSetupGenerator {
	constructor(
		private readonly app: App,
		private rootFolder: string,
	) {}

	setRootFolder(rootFolder: string): void {
		this.rootFolder = rootFolder;
	}

	/** Generate (or regenerate) the API setup guide. */
	async generate(): Promise<string> {
		const filePath = normalizePath(`${this.rootFolder}/API_SETUP.md`);
		const content = this.buildContent();

		const existing = this.app.vault.getAbstractFileByPath(filePath);
		if (existing) {
			await this.app.vault.modify(existing as import("obsidian").TFile, content);
		} else {
			await this.app.vault.create(filePath, content);
		}

		return filePath;
	}

	private buildContent(): string {
		return `---
type: guide
title: "API Setup Guide"
tags: [puppet, setup, api]
---

# Puppet — API setup guide

This guide explains how to obtain API keys for each provider used by the Puppet plugin.

---

## OMDb (Movies / TV Series)

OMDb provides movie and TV series data sourced from IMDb.

1. Go to [OMDb API](https://www.omdbapi.com/apikey.aspx)
2. Select the **Free** tier (1,000 requests/day) or a paid plan
3. Enter your email and submit
4. Check your email for the API key
5. Paste the key into **Settings → Puppet → OMDb API key**

---

## TMDB (Movies / TV Series)

TMDB (The Movie Database) is a community-built movie and TV database.

1. Create an account at [TMDB](https://www.themoviedb.org/signup)
2. Go to **Settings → API** or visit [API Settings](https://www.themoviedb.org/settings/api)
3. Apply for an API key (select "Developer" usage)
4. Copy the **API Key (v3 auth)** value
5. Paste the key into **Settings → Puppet → TMDB API key**

---

## Google Books (Books)

Google Books API provides book metadata and cover images.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for "Books API" and enable it
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API key**
7. Copy the key and paste it into **Settings → Puppet → Google Books API key**

> Note: Google Books works without an API key at reduced rate limits.

---

## Open Library (Books)

Open Library is a free, open-source book database. **No API key required.**

- API docs: [Open Library API](https://openlibrary.org/developers/api)

---

## Jikan (Anime / Manga)

Jikan is a free, unofficial MyAnimeList API. **No API key required.**

- Rate limit: 3 requests per second
- API docs: [Jikan API](https://docs.api.jikan.moe/)

---

## Alpha Vantage (Stocks / Finance)

Alpha Vantage provides real-time and historical stock data.

1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Fill in the form and click **Get Free API Key**
3. Copy the key and paste it into **Settings → Puppet → Alpha Vantage API key**

> Free tier: 25 requests/day, 5 requests/minute.

---

## CoinGecko (Crypto)

CoinGecko provides cryptocurrency market data. **No API key required** for the free tier.

- API docs: [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- Rate limit: 10-30 requests/minute (free tier)

---

## Tips

- Store your API keys in **Settings → Puppet** — they are saved locally in your vault's plugin data
- API keys are never transmitted anywhere except to the respective API endpoints
- For higher rate limits, consider upgrading to paid tiers of the respective services
- You can use the **Puppet: Generate API setup guide** command to regenerate this file
`;
	}
}
