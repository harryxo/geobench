# GeoGuesser AI Benchmark

Benchmark multimodal models on GeoGuessr-style location guessing from images.

This repository includes:

- A benchmark script that evaluates model predictions against a fixed location dataset
- A Next.js web app with leaderboard and arena views
- Provider-based inference with OpenRouter (default) and Vertex AI fallback

## Project Status

- **Production path:** Arena API route with selectable provider/model (OpenRouter or Vertex)
- **Partially implemented:** leaderboard aggregation from local benchmark results
- **Demo placeholders:** benchmark playground page behavior

## Features

- **Benchmark script (`scripts/run_benchmark.ts`)**
  - Loads benchmark locations from `benchmark_data/locations.json`
  - Fetches Street View images by `panoId`
  - Calls Gemini on Vertex AI with structured prompts
  - Calculates distance error and threshold accuracy
  - Writes results to `benchmark_results.json`

- **Web app (Next.js)**
  - `app/leaderboard/page.tsx`: model ranking UI
  - `app/arena/page.tsx`: upload image and compare model outputs
  - `app/api/geoguess/route.ts`: provider-agnostic inference route for Arena

## Quick Start

### 1) Install

```bash
pnpm install
```

### 2) Configure environment variables

```bash
cp .env.example .env.local
```

Fill in required values in `.env.local`.

### 3) Run the app

```bash
pnpm dev
```

### 4) Run tests

```bash
pnpm test
```

### 5) Type check

```bash
pnpm exec tsc --noEmit
```

## Environment Variables

Required for benchmark:

- `GOOGLE_MAPS_API_KEY`

Recommended for Arena/API (default path):

- `GEOGUESS_DEFAULT_PROVIDER` (`openrouter` or `vertex`)
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (optional override)

Required for Vertex provider:

- `GCP_PROJECT_ID`
- `VERTEXAI_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS` (local file path)

Optional (for hosted environments like Vercel):

- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_PRIVATE_KEY`

See `.env.example` for a template.

## Open Source

- License: MIT (`LICENSE`)
- Contributing guide: `CONTRIBUTING.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security policy: `SECURITY.md`

## Development Notes

- Benchmark outputs in `benchmark_results.json` are generated artifacts.
- Do not commit secrets in `.env`, `.env.local`, or key files.
