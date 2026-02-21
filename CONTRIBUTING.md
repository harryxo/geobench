# Contributing

Thanks for your interest in contributing.

## Getting Started

1. Fork the repository and create a feature branch:
   - `git checkout -b feat/your-change`
2. Install dependencies:
   - `pnpm install`
3. Copy environment variables:
   - `cp .env.example .env.local`
4. Run the app:
   - `pnpm dev`

## Development Workflow

- Keep pull requests focused and small.
- Add or update tests for behavior changes.
- Run checks before opening a PR:
  - `pnpm test`
  - `pnpm typecheck`

## Benchmark Workflow

- Benchmark data lives in `benchmark_data/locations.json`.
- Run the benchmark script:
  - `pnpm ts-node scripts/run_benchmark.ts`
- Results are written to `benchmark_results.json`.

## Pull Request Guidelines

- Describe what changed and why.
- Link related issues.
- Include screenshots for UI changes.
- Mention any new environment variables or setup changes.
