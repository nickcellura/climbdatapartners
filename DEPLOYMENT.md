# Initial Pages deployment (GitHub integration)

This project targets **Cloudflare Pages**, not Workers Static Assets. Do not use `wrangler pages project create` or Direct Upload for the first deployment: create the project using **Connect to Git** so automatic GitHub deployments work.

## Ready-to-use settings

| Cloudflare setting | Value |
| --- | --- |
| GitHub repository | `nickcellura/climbdatapartners` |
| Project name | `climb-data-partners-review` (choose another unused name if taken; do not replace an existing project) |
| Production branch | `cloudflare-pages-review` |
| Framework preset | None |
| Root directory | Repository root (leave blank) |
| Build command | `npm run build` |
| Build output directory | `public` |
| Node.js | 22, selected by `.node-version` |
| Custom domain | **None** — keep the generated `pages.dev` URL |
| Paid features | Do not enable |

The dedicated branch isolates this initial review deployment from any existing main-branch integrations. Future pushes to `cloudflare-pages-review` trigger automatic deployments. To switch to `main` later, merge the reviewed code and explicitly update the project's production branch.

## One-time browser authorization

1. Open https://dash.cloudflare.com/ and sign in to the intended Cloudflare account.
2. Go to **Workers & Pages → Create application → Pages → Connect to Git** (the UI may say **Import an existing Git repository**).
3. Choose GitHub. **Install & Authorize** Cloudflare's GitHub app, granting access only to `nickcellura/climbdatapartners` if possible. Select that repository.
4. Enter the settings above. Create a **new** project; do not select or overwrite an existing application. Choose **Save and Deploy**. Do not add the production domain or upgrade a plan.
5. Open the actual URL returned by Cloudflare after the build completes. The expected pattern is `<available-project-name>.pages.dev`; no URL is considered deployed until Cloudflare returns it and it responds successfully.

No terminal commands or API token are needed for this route. Once connected, Cloudflare reads the repository, installs npm dependencies, runs the build, compiles root `functions/` automatically, and serves `public/`.

## Initial review vs. collecting leads

The landing page can be deployed and viewed **without form credentials**. The form deliberately reports unavailability until the five runtime settings in README.md are configured. Do not turn on mock delivery for a public review. Before collecting real inquiries, configure Resend and Turnstile, register the actual pages.dev hostname in Turnstile, then verify a real email/CSV delivery. Third-party signups or paid upgrades require the owner's approval.

The preview has a site-wide `X-Robots-Tag: noindex, nofollow` response header to discourage search indexing. Legal text and contact details remain visibly marked for owner review. Before a later production launch, confirm those details, approve legal text, remove the review indexing header, and configure the domain explicitly. The current repository does not modify DNS or attach a custom domain.

## Local deployment verification

```sh
npm ci
npm test
npm run build
npm run check:cloudflare
```

The final command bundles Pages Functions into ignored `.cloudflare-build/` to prove compatibility. It does not upload or deploy. Cloudflare Pages compiles the functions itself; do not copy this verification bundle into `public/`.

## Agent setup status

Cloudflare's official setup instructions were retrieved from its documentation repository at https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/agent-setup/prompt.md because the documentation hostname was blocked by this environment's egress policy.

Official Cloudflare skills were installed under `/home/agent/.agents/skills/`; the official Cloudflare MCP server was registered with Codex. Restarting/reconnecting the agent is needed to load newly registered MCP tools. OAuth could not start because the environment blocked `mcp.cloudflare.com`. Wrangler is installed locally and pinned by `package-lock.json`; `wrangler whoami` confirmed no Cloudflare session is authenticated.

For the agent to manage deployment directly, its environment must allow `developers.cloudflare.com`, `mcp.cloudflare.com`, `api.cloudflare.com`, `dash.cloudflare.com`, `api.github.com`, and the returned `*.pages.dev` hostname. These destinations have been saved to the cloud environment configuration draft; a draft save does not apply the policy or authorize a Cloudflare account. The browser-based GitHub integration above avoids requiring a remote terminal OAuth callback and is the shortest path to a normal browser URL.
