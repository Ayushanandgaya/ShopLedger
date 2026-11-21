# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node.js/Express POS, inventory, Khata, and GST app. `server.js` wires the app and serves static files from `public/`; `routes/` contains API routers; `lib/` holds business logic; `config.js` contains shop, tax, inventory, and coupon settings; and `data/db.json` is the local JSON store. Browser assets live in `public/index.html`, `public/js/`, and `public/css/`. `docs/architecture.svg` diagrams the main modules and checkout flow. There is no test directory in the repository.

## Build, Test, and Development Commands

- `npm start` — starts the local server using `node server.js` (default port 3000; `PORT` can override it).
- `node server.js` — equivalent direct startup command.
- `npm test` — currently a placeholder that exits with “no test specified”; do not treat it as a passing test suite.

There is no build, lint, or formatting script configured. Do not run a startup command against real data unless you intend to operate the local app.

## Coding Style & Naming Conventions

Match the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use descriptive lower camel case for functions and variables; filenames are lowercase, such as `pricing.js` and `orders.js`. Keep HTTP handling in `routes/` and reusable business rules in `lib/`. Preserve established route prefixes and response shapes when changing API behavior.

## Testing Guidelines

No testing framework, test files, or coverage target is configured. For a change, describe what was checked and any manual verification steps in the pull request. Add focused tests when introducing a test framework or changing calculations, and cover checkout totals, coupon limits, GST slabs, inventory boundaries, and invoice reconciliation.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase descriptive subjects without conventional prefixes (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that pattern. Pull requests should explain the behavior change, note affected routes or data, include verification steps, and provide screenshots for browser UI changes. Call out changes to persisted JSON structure or tax calculations clearly.

## Security & Data

Treat `data/db.json` as sensitive: it contains customer contact and account information. Do not add real customer records or credentials to commits. Keep secrets out of `config.js`; review access controls before changing admin endpoints. Checkout and printable invoice calculations are separate paths, so verify that any pricing or GST change keeps their results consistent.
