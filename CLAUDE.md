# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bilingual (FR/EN) personal portfolio built with **Hugo Extended**, deployed to GitHub Pages at `https://clixmods.github.io/`. French is the default language served at the root; English is served under `/en/`.

## Commands

```bash
# Local dev server (auto-reloads, serves at http://localhost:1313)
hugo server --config hugo.dev.toml

# Production build (matches CI output in ./public)
hugo --gc --minify --environment production

# Include drafts / future-dated content while previewing
hugo server --config hugo.dev.toml -D -F
```

There is no `package.json` / test suite. CI installs Node only to run `uglify-js` over the built HTML/JS. Toolchain versions pinned in `.github/workflows/hugo.yaml`: Hugo Extended `0.150.0`, Go `1.25.1`, Dart Sass `1.92.1`, Node `22.18.0`. Hugo Extended (not standard Hugo) is required — the theme uses Dart Sass.

`hugo.toml` is the production config (baseURL `clixmods.github.io`); `hugo.dev.toml` overrides only the baseURL to localhost. Both reference the same theme and language setup.

## Content + data architecture (the key concept)

Content is authored in `content/` as TOML-front-matter Markdown (`+++` fences), one file per language: `name.md` (FR) and `name.en.md` (EN). Content sections: `projects/`, `people/`, `experiences/`, `educations/`, `posts/`, `skills/`.

**Technologies, skills, tools, specialties, and languages are referenced by stable keys, never by display text.** In front matter you'll see arrays like:

```toml
programming_languages = [ "lang_csharp" ]
frameworks_engines    = [ "fw_unity" ]
specialties           = [ "spec_lighting", "spec_algorithmique" ]
soft_skills           = [ "skill_communication" ]
tools                 = [ "tool_github" ]
```

Each key resolves through two layers:
- **`data/*.json`** maps the key → presentation metadata (icon emoji, `iconPath` SVG under `static/images/technologies/`, hex `color`, `experience` level, `displayedInPortfolio`). Files: `programming_languages.json`, `frameworks_engines.json`, `specialties.json`, `soft_skills.json`, `tools.json`, plus `profile.json`, `testimonials.json`, `certifications.json`, etc.
- **i18n translations in the theme submodule** map the key → human-readable label per language.

Many data files have an `.en.json` sibling and/or a copy under `data/en/` for English. `data/name-to-key-mapping.json` records the display-name → key mapping used during migrations.

When adding a technology/skill/tool to a project: use an existing key if one exists (check the matching `data/*.json`), or add a new entry to the `data/*.json` file (with an SVG in `static/images/technologies/`) **and** the corresponding i18n label in the theme — otherwise it renders as a raw key.

## Front Matter CMS

This repo is configured for [Front Matter CMS](https://frontmatter.codes/) (VS Code). The content-type schemas, field groups, page-folder definitions, and data-file schemas are split across `.frontmatter/config/**` and the root `frontmatter.json`. These define the editing UI for each content type (`project-content-type`, `person-content-type`, `experience-content-type`, `education-content-type`, etc.) — including which front-matter fields exist and which `data/*.json` files back the relationship pickers. If you add a front-matter field that should be editable in the CMS, update the matching content-type JSON.

## Deployment

`.github/workflows/hugo.yaml` builds and deploys to GitHub Pages on every push to `main` (checked out with `submodules: recursive`). Before building, CI strips `console.log` lines from all `.html` files and runs `uglify-js --compress drop_console=true` over all `.js`. Don't rely on `console.log` surviving in production.

## scripts/

One-off **migration utilities** (JS + PowerShell), not part of the normal build. They were used to convert content and data from display-name references to the `lang_*` / `fw_*` / `spec_*` / `skill_*` / `tool_*` key system and to align FR/EN i18n keys. Re-run only when doing a similar bulk content migration; output lands in `scripts/migration-output/`.
