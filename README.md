# Space Weathers CLI

A CLI tool to display Mars, Sun, and Moon weather from NASA APIs.

## Features

- 🔴 Mars Weather - Temperature, pressure, and wind data from InSight mission
- ☀️ Sun Weather - Solar flares, geomagnetic storms, and coronal mass ejections
- 🌙 Moon Report - Moon phase, surface temperature estimates, and NEO tracking

## Installation

### Global installation:
```bash
bunx space-weathers
# or
npm -g i space-weathers
```

### Local development:
```bash
git clone https://github.com/mingder78/pi_setting.git
cd pi_setting
bun install
bun run index.ts
```

## Usage

```bash
# Run the CLI
bun run index.ts

# Development with hot reload
bun run dev
```

## Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Required variables:
- `NASA_API_KEY`: NASA API key (optional, defaults to DEMO_KEY)
- `GITHUB_TOKEN`: GitHub token for automated releases
- `NPM_TOKEN`: NPM token for publishing

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run linting
bun run lint

# Build project
bun run build

# Release (requires proper credentials)
bun run release
```

## CI/CD

This project uses GitHub Actions with Bun and Aegir for:
- Automated testing on each push
- Linting and build verification
- Automatic releases to npm and GitHub

## About

This CLI fetches real-time data from NASA's APIs to provide space weather information.

*Note: Mars weather data is from the InSight mission which ended in December 2022.*

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
