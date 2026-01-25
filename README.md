# Beast Domain Checker

A fast, beautiful bulk domain availability checker powered by Namecheap Beast Mode automation using Puppeteer.

![Astro](https://img.shields.io/badge/Astro-5.x-orange)
![Puppeteer](https://img.shields.io/badge/Puppeteer-24.x-green)
![License](https://img.shields.io/badge/License-MIT-blue)

![Beast Domain Checker Screenshot](public/screenshot.png)

## Features

- **Bulk Checking** - Check up to 1000 domains at once
- **Multiple Input Methods** - Upload CSV/TXT or paste directly
- **Favorites System** - Save domains with prices for later
- **Export Results** - Download as CSV
- **Real-time Stats** - See available, taken, and premium counts
- **Modern UI** - Dark theme with gradient accents

## Quick Start

### Docker Compose (Recommended)

```bash
git clone https://github.com/YOUR_USERNAME/beast-domain-checker.git
cd beast-domain-checker
docker compose up -d
```

### Docker

```bash
# Build image
docker build -t beast-domain-checker .

# Run container
docker run -d -p 6006:6006 --name beast-domain-checker beast-domain-checker

# Stop container
docker stop beast-domain-checker

# Remove container
docker rm beast-domain-checker
```

Open [http://localhost:6006](http://localhost:6006) in your browser.

### Manual Installation

```bash
# Install dependencies (Puppeteer will download Chromium automatically)
npm install

# Start development server
npm run dev
```

> **Note:** Puppeteer automatically downloads a compatible Chromium browser during `npm install`. No additional installation steps required!

## Usage

### Upload File

Create a CSV or TXT file with one domain per line:

```
example.com
mysite.dev
awesome.io
```

### Paste Domains

Paste domains directly in the textarea, one per line.

### Save Favorites

Click "Add to Favorites" on any result to save it for later.

## Project Structure

```
beast-domain-checker/
├── src/
│   ├── lib/
│   │   ├── domainChecker.ts   # Puppeteer automation
│   │   ├── csvParser.ts       # File parsing
│   │   └── storage.ts         # Data persistence
│   ├── pages/
│   │   ├── index.astro        # Main UI
│   │   └── api/
│   │       ├── check-domains.ts
│   │       └── favorites.ts
│   └── styles/
│       └── global.css
├── public/
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose configuration
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Tech Stack

- [Astro](https://astro.build) - Web framework
- [Puppeteer](https://pptr.dev) - Headless Chrome automation
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [TypeScript](https://typescriptlang.org) - Type safety
- [Docker](https://docker.com) - Containerization

## Configuration

### Port

Edit `astro.config.mjs` to change the default port (6006):

```js
export default defineConfig({
  server: { port: 3000 }
});
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Disclaimer

This tool automates Namecheap's Beast Mode for domain checking. Use responsibly and in accordance with Namecheap's terms of service.
