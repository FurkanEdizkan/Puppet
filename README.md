# Puppet

Create and manage notes for movies, TV series, books, anime, games, research papers, and more with automatic metadata from various APIs.

## Features

- Search and create structured notes with rich metadata (YAML frontmatter)
- Automatic cover image downloading
- Research paper PDF downloading from arXiv
- Organized folder structure per content type
- Quick access ribbon icon for adding content
- Configurable providers per domain
- Per-domain enable/disable toggles

### Supported content types

| Domain | Provider | API key required |
|---|---|---|
| Movies & TV Series | [OMDb](https://www.omdbapi.com/) | Yes |
| Books | [Google Books](https://developers.google.com/books) | Optional |
| Books | [Open Library](https://openlibrary.org/) | No |
| Anime, Manga, Manhwa | [Jikan](https://jikan.moe/) (MyAnimeList) | No |
| Games | [Steam Store](https://store.steampowered.com/) | No |
| Board Games | [BoardGameGeek](https://boardgamegeek.com/) | No |
| Research Papers | [arXiv](https://arxiv.org/) | No |

## Installation

### From community plugins (once published)

1. Open **Settings > Community plugins**
2. Select **Browse** and search for **Puppet**
3. Select **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/FurkanEdizkan/Puppet/releases/latest)
2. Create a folder called `puppet` inside your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Restart Obsidian and enable the plugin in **Settings > Community plugins**

## API keys

Most providers work without an API key. For providers that require one, see the guides below.

All API keys are configured in **Settings > Puppet > API keys** and stored locally in your vault's plugin data. Keys are only sent to their respective API endpoints.

### Movies & TV Series

- **[OMDb](https://www.omdbapi.com/)** — API key required
  1. Go to [OMDb API](https://www.omdbapi.com/apikey.aspx)
  2. Select the **Free** tier (1,000 requests/day) or a paid plan
  3. Enter your email and submit
  4. Check your email for the API key
  5. Paste the key into **Settings > Puppet > OMDb API key**

- **[TMDB](https://www.themoviedb.org/)** — optional alternative
  1. Create an account at [TMDB](https://www.themoviedb.org/signup)
  2. Go to **Settings > API** or visit [API Settings](https://www.themoviedb.org/settings/api)
  3. Apply for an API key (select "Developer" usage)
  4. Copy the **API Key (v3 auth)** value
  5. Paste the key into **Settings > Puppet > TMDB API key**

### Books

- **[Google Books](https://developers.google.com/books)** — API key optional (works without one at reduced rate limits)
  1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project (or select an existing one)
  3. Navigate to **APIs & Services > Library**
  4. Search for "Books API" and enable it
  5. Go to **APIs & Services > Credentials**
  6. Select **Create Credentials > API key**
  7. Copy the key and paste it into **Settings > Puppet > Google Books API key**

- **[Open Library](https://openlibrary.org/)** — no key needed

### Anime, Manga & Manhwa

- **[Jikan](https://docs.api.jikan.moe/)** (MyAnimeList) — no key needed. Rate limit: 3 requests per second.

### Games

- **[Steam Store](https://store.steampowered.com/)** — no key needed

### Board Games

- **[BoardGameGeek](https://boardgamegeek.com/)** — no key needed

### Research Papers

- **[arXiv](https://arxiv.org/)** — no key needed

## Usage

- Use the **ribbon icon** (sidebar) to pick a content type and search
- Or use the **command palette** (`Ctrl/Cmd + P`) and search for commands like:
  - `Puppet: Add movie`
  - `Puppet: Add book`
  - `Puppet: Add anime`
  - `Puppet: Add research paper`
  - etc.

## Settings

| Setting | Description |
|---|---|
| Root folder | Vault folder where Puppet stores all content (default: `Puppet`) |
| Auto-download images | Automatically save cover art to your vault |
| Enabled domains | Toggle which content types are available |
| Movie/Book provider | Choose between available providers per domain |
| Paper format | Preferred format for downloading research papers |
| API keys | Configure keys for providers that require them |

## Contributing

Contributions are welcome! Please read the [commit convention](.github/COMMIT_CONVENTION.md) before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes using [conventional commits](.github/COMMIT_CONVENTION.md)
4. Ensure `npm run build`, `npm run test`, and `npm run lint` all pass
5. Open a pull request

## Contributors

<!-- readme: contributors -start -->
<!-- readme: contributors -end -->

## License

[BSD](./LICENSE)
