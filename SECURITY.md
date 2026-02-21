# Security Policy

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Instead, report vulnerabilities privately to the maintainer with:

- A clear description of the issue
- Steps to reproduce
- Impact assessment
- Suggested mitigation (if available)

You should receive an acknowledgement within 72 hours.

## Scope

This includes:

- API routes under `app/api`
- Benchmark scripts under `scripts`
- Authentication and credential handling
- Dependency vulnerabilities

## Secret Handling

- Never commit credentials, private keys, or API tokens.
- Use `.env.local` for local development and CI secret stores for automation.
