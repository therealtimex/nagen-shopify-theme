# Repository Guidelines

## Development Philosophy
- Ship production-ready, clean, and highly readable code that can land in main without follow-up fixes.
- Limit work to the changes that are truly needed; resist over-engineering or opportunistic refactors.
- Add comments only when they clarify intent or highlight non-obvious decisions—prefer self-documenting code.

## Project Structure & Module Organization
- Theme follows standard Shopify layout: Liquid entrypoints in `layout/`, reusable fragments in `snippets/`, section blocks in `sections/`, and JSON or Liquid templates in `templates/`.
- Front-end assets live in `assets/` (plain CSS/JS plus a few `.liquid`-rendered stylesheets); translation files are in `locales/`. Global settings and schema definitions reside under `config/`.
- Use existing files as references when adding new sections or templates to keep schema options and translations consistent.

## Development, Build, and Preview
- Use Shopify CLI for all environment tasks. Common flows:
  - `shopify login --store <store>`: authenticate before pushing or previewing.
  - `shopify theme dev --store <store>`: run a live preview with hot reload against the target store.
  - `shopify theme pull --store <store>` / `shopify theme push --store <store>`: sync remote changes; always pull before pushing to avoid overwriting merchant edits.
  - `shopify theme check`: run Liquid/JSON validation locally.
- There is no asset bundler; keep new CSS/JS small, and prefer reusing existing files over introducing new ones unless necessary.

## Coding Style & Naming Conventions
- Liquid/HTML/JSON use two-space indentation. Favor readable control-flow tags (`{% if %}`, `{% for %}`) and keep logic minimal in templates—move reusable pieces into `snippets/`.
- CSS uses custom properties heavily; match existing naming (`--color-*`, component-scoped classes) and avoid duplicate variables. Co-locate styles with their sections when possible.
- JavaScript in `assets/` is vanilla; prefer small, self-contained modules and reuse existing event/data attributes already present in templates.

## Testing & QA Expectations
- Run `shopify theme check` before committing to catch schema and Liquid errors.
- Manual QA is required: exercise header/footer, navigation menus, cart/mini-cart, search, product pages (variants, media, pickup), blog/article, account flows, and any new section you add. Capture screenshots or notes for changed flows.
- Verify translations: add keys to all `locales/*.json` files when introducing new copy.

## Commit & Pull Request Guidelines
- Commit history currently follows a Conventional Commit-style prefix (`chore:` observed); continue with clear verbs (`feat:`, `fix:`, `chore:`) and scope where helpful.
- Keep commits focused; include the Shopify CLI commands or QA steps you ran in the body when relevant.
- PRs should describe the change, affected sections/templates, and any merchant-facing settings added. Link related issues/tickets and attach preview URLs or screenshots for UI changes.

## Localization & Configuration Notes
- Schema options live in `config/settings_schema.json`; default values in `config/settings_data.json`. Update both when adding theme settings.
- When new text is introduced, update `locales/en.default.json` first, then propagate keys to other locale files to avoid missing translations in production.
