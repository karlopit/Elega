# AGENTS.md — Frontend (Next.js)

This file gives AI coding agents (Claude Code, Codex, Cursor, etc.) the context and rules needed to work on this repository. Read this before making changes.

## Project Overview

Next.js storefront for an online clothing store. Consumes a separate FastAPI backend (polyrepo — backend lives in a different repository) over HTTPS. Deployed on Vercel (free tier).

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS (styling)
- Deployed on Vercel

## Brand

Brand name: **Elega**

Elega is a clothing store. The site must feel elegant, modern, and premium — closer to a boutique fashion house than a generic e-commerce template. Avoid anything that looks like a stock Shopify theme or a default component-library layout.

## Design & Theme Rules

- **Color palette**: White is the dominant color throughout the site — backgrounds, whitespace, and base surfaces should be white or near-white. Gold is an accent only, used sparingly for: text highlights, links/hover states, dividers, icons, borders, and small details (e.g. price tags, call-to-action underlines). Gold should never dominate a layout or fill large surface areas (no gold backgrounds, no gold buttons as a default state). Suggested tones:
  - Primary white: `#FFFFFF` or a very soft off-white (`#FAFAF8`) for warmth
  - Gold accent: a muted, elegant gold rather than a bright/gaudy one (e.g. `#C9A24B` or `#B8935A`), used at low frequency
  - Near-black or deep charcoal (`#1A1A1A`) for primary body text and contrast — not pure black, which reads harsher
  - Define these as CSS variables / Tailwind theme extensions, not hardcoded hex values scattered across components

- **Typography**: Use an elegant serif or refined sans-serif for headings (e.g. something with fashion-editorial character), paired with a clean, highly readable sans-serif for body text. Avoid default system fonts as the final choice. Generous letter-spacing on headings and uppercase labels (common in fashion branding) is encouraged.

- **Layout philosophy**: Lean into whitespace. Let products and imagery breathe rather than cramming grids tightly. Asymmetry, generous margins, and editorial-style layouts (like a fashion lookbook) are preferred over boxy, symmetric e-commerce grids.

- **Originality requirement**: Do not use default/common UI patterns verbatim (e.g. generic Bootstrap-style cards, default shadcn component looks without customization, typical "3-column product grid with drop shadow cards" seen on countless templates). Every core component (navbar, product card, buttons, footer) should have a distinct, intentional visual identity that reflects the Elega brand — not an out-of-the-box look.

- **Motion / transitions**: The site should feel alive but not busy. Use subtle, tasteful transitions and micro-interactions rather than flashy effects. Examples to consider:
  - Smooth fade/slide-in on scroll for product sections
  - Elegant hover states on product cards (e.g. subtle image zoom, gold underline reveal on text, soft shadow lift)
  - Smooth page/route transitions between pages rather than hard cuts
  - Animated underline or gold accent line reveal on nav links when hovered/active
  - Avoid gimmicky or excessive animation — everything should read as refined, not flashy. If unsure whether an effect is "too much," default to more subtle.

- **Buttons & CTAs**: Primary buttons should stay minimal — e.g. white background with a thin gold border and gold text, or a deep charcoal button with a gold hover underline — rather than solid gold blocks. Gold should read as a refined detail, not a loud call-to-action color.

- **Imagery**: Product photography should be given room to be the visual focus. Avoid busy background patterns or competing colors near product images — let the white space frame the product itself.

- Before implementing a new component, briefly consider: "Would this look like a generic e-commerce template?" If yes, revise the approach until it feels distinctly Elega.

## Project Structure

```
app/                # Pages and routes (App Router)
components/          # Reusable UI components
lib/                  # API wrapper functions, helpers
context/               # Global state (cart, auth)
public/                 # Static assets
```

## Commands

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Build for production: `npm run build`
- Lint: `npm run lint`

## Code Style Rules

- **No emojis** anywhere in code, comments, commit messages, UI copy, or console output.
- Code must be clean but still understandable — prioritize readability over cleverness. Prefer clear component/variable names over compressed one-liners.
- Use functional components and React hooks; no class components.
- Keep components small and single-purpose. If a component handles more than one clear responsibility, split it.
- Consistent naming: camelCase for variables/functions, PascalCase for components.
- No commented-out dead code left in commits.
- All API calls go through `lib/api.js` — do not scatter raw `fetch()` calls directly inside components.

## Security Requirements (mandatory, non-negotiable)

- **No secrets in client code**: Never put API keys, database URLs, or private credentials in frontend code. Only `NEXT_PUBLIC_*` env vars are safe here, and only for genuinely public values (e.g. the backend API base URL).
- **Input validation**: Validate and sanitize all user input client-side as a first layer, but never treat client-side validation as the source of truth — the backend must always re-validate.
- **XSS prevention**: Never use `dangerouslySetInnerHTML` with unsanitized data. Let React's default escaping handle rendering; do not bypass it without a clear, reviewed reason.
- **HTTPS only**: All requests to the backend API must use HTTPS, never HTTP.
- **Auth tokens**: If storing auth tokens client-side, prefer httpOnly cookies over localStorage where possible to reduce XSS token theft risk. If localStorage must be used, understand and document the tradeoff.
- **CSRF awareness**: If using cookie-based auth, ensure CSRF protections are in place on state-changing requests.
- **Dependency hygiene**: Keep `package.json` dependencies current and avoid adding packages with poor maintenance history or excessive permissions.
- **Rate limiting awareness**: Handle 429 (rate limited) responses from the backend gracefully in the UI, rather than retrying aggressively.
- **Error handling**: Never expose raw backend error messages, stack traces, or internal details to the user. Show a clean, generic error state and log details to the console only in development.

## General Development Practices

- Use environment variables (`NEXT_PUBLIC_API_URL`, etc.) for all environment-specific values — never hardcode the backend URL.
- Handle loading and error states explicitly for every API call (the backend is on a free tier and may have cold-start delays — design loading states accordingly).
- Keep global state (cart, auth) centralized in `context/`, not duplicated across components.
- Write accessible markup: semantic HTML, alt text on images, proper form labels.
- Commit messages should be clear and describe *why*, not just *what*.
- Test critical user flows manually before considering a feature done: browse products, add to cart, checkout, view orders.

## What NOT to Do

- Do not add emojis to any output, code, UI text, or messages.
- Do not hardcode API URLs, secrets, or credentials.
- Do not bypass React's escaping for user-generated content.
- Do not make direct fetch calls outside of `lib/api.js`.
- Do not silently ignore failed API calls — always handle and surface errors appropriately.
