# Nagen Shopify Theme

Custom Shopify theme (internally **Bigmedix v1.0.0**) by RealTimeX. Not based on Dawn or any starter theme.

## Structure

```
assets/          CSS, JS, fonts, images — no build step, served directly
blocks/          Theme blocks
config/
  settings_schema.json   Theme setting definitions (editable in Shopify admin)
  settings_data.json     Current store values (auto-managed by Shopify admin)
layout/
  theme.liquid           Main page layout
  password.liquid        Password/coming-soon layout
locales/         52 language files (en.default.json is primary)
sections/        ~138 section components with admin-customizable schemas
snippets/        ~160 reusable Liquid fragments (icons, cards, nav, etc.)
templates/       ~49 page templates (JSON + Liquid)
AGENTS.md        Coding standards
```

### No build tools

All assets are plain CSS/JS. Bootstrap is included pre-compiled. No webpack, Vite, or preprocessors.

- CSS uses custom properties (`--color-*`). Match existing naming.
- JS is vanilla, self-contained modules. No frameworks.

### Template variants

Multiple product templates exist for different layouts:

- `product.json` — standard
- `product.slider.json` — image slider
- `product.left-thumb.json` / `product.right-thumb.json` — thumbnail nav
- `product.grid-view.json` — grid variants
- `product.quick-buy-drawer.liquid` — quick buy modal
- `product.service-single.json` — service products
- `product.crosssell.json` / `product.upssell.json` — cross/upsell

Collection, blog, customer account, and custom page templates are in `templates/`.

## Development

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli/install)
- Store access (Partner or staff)

### Commands

```sh
# Local dev server with hot reload
shopify theme dev --store <store-name>

# Pull latest from store (picks up merchant admin edits)
shopify theme pull --store <store-name>

# Push local changes to store
shopify theme push --store <store-name>

# Validate Liquid and JSON
shopify theme check
```

### Workflow

1. `shopify theme pull` before starting work — merchant edits via Shopify admin are common and will be lost if you push without pulling first.
2. Develop with `shopify theme dev` for live preview.
3. Run `shopify theme check` before committing.
4. Test manually: header/footer, nav, cart, product pages, blog, account flows.

### Localization

- Add new text keys to `locales/en.default.json` first, then propagate to other locale files.
- 52 locales supported.

### Settings

- `config/settings_schema.json` — defines what merchants can customize (colors, typography, components).
- `config/settings_data.json` — current values. Auto-managed by Shopify admin; avoid manual edits.

## Deployment

**`main` branch is connected to the live store via GitHub integration.** Pushing to `main` deploys to production.

```
git push origin main → GitHub integration syncs → store updated
```

No staging branch. No CI/CD. All commits to `main` go live.

### Commit conventions

Use conventional prefixes: `feat:`, `fix:`, `chore:`, `refactor:`.

> "Update from Shopify" commits in the history are auto-synced merchant edits from Shopify admin.

### Remote

```
origin  https://github.com/therealtimex/nagen-shopify-theme.git
```

## Reference

- [AGENTS.md](./AGENTS.md) — full coding standards
- [Shopify CLI docs](https://shopify.dev/docs/themes/tools/cli)
- [Liquid reference](https://shopify.dev/docs/api/liquid)