# Contributing to Threadline

Threadline is an evidence-native software-intelligence concept built as a deterministic, zero-credential demo. Contributions should strengthen the product story while preserving provenance, accessibility, and reproducibility.

## Local setup

Use Node.js 24 and npm:

```bash
npm ci
npm run dev
```

The app runs at `http://localhost:3000`. No `.env` file, external account, or production API is required.

## Project shape

- `src/app` contains App Router routes, metadata, and error states.
- `src/components` contains reusable product, shell, and visualization components.
- `src/lib/demo-data.ts` is the canonical deterministic scenario.
- `src/lib/demo-utils.ts` contains pure selectors and formatters.
- `tests` protects the data graph and utility behavior.
- `public/sw.js` provides only the offline navigation fallback; it must not cache `/_next`, API, or React Server Component responses.

Keep observed evidence, model inference, and proposed action visually and semantically distinct. Never make simulated actions appear to have affected a real system.

## Quality checks

Run the complete local gate before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

For UI changes, also check narrow and wide layouts, keyboard navigation, visible focus, reduced motion, and text contrast. Interactive controls need accessible names; decorative icons should be hidden from assistive technology.

## Data changes

Demo data is intentionally fixed so screenshots, tests, and incident reasoning stay reproducible. When changing it:

1. preserve unique IDs and valid cross-references;
2. keep timeline and metric samples chronologically ordered;
3. update selectors and invariant tests together;
4. document any change to the incident narrative in the pull request.

Never add credentials, copied production logs, customer names, or personal data.

## Pull requests

Keep each pull request focused. Explain the user-visible outcome, attach evidence for visual changes, name likely failure modes, and describe the smallest safe rollback. CI must pass before review.

By participating, you agree to collaborate respectfully and provide actionable, evidence-based feedback.
