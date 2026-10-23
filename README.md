# Climb Data Partners

**Initial deployment:** see [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub-connected `pages.dev` review setup. No production domain is attached.

A fast, responsive static landing page with Cloudflare Pages Functions for inquiry delivery. No framework, database, CRM, or client-side dependencies. Wrangler is development-only.

## Local review

Use Node.js 22+ and npm:

```sh
npm ci
npm run dev -- --ip 0.0.0.0 --port 3000
```

`npm run preview` serves only the static design on port 3000; API submission requires `npm run dev`. `npm test` exercises the form handler and `npm run build` checks deployment assets. Existing cloud tasks are isolated: use this checkout; no Git worktree is needed.

For an explicitly labeled local confirmation demonstration only, set `demoForm: true` in `public/config.js`, then restore it to `false`. The demo works only on localhost/127.0.0.1, never sends an inquiry, and never triggers a conversion. Production default is false.

## Form delivery

A same-origin Pages Function at `/api/inquiry` validates input and consent, checks a honeypot/minimum completion time, verifies Cloudflare Turnstile on the server, then emails the configured recipient through Resend. Each email includes a CSV attachment with the submission, UTC timestamp, consent flags/version, and UTM parameters; import into Google Sheets or combine CSV files as needed. No form submissions are stored in an application database. Never forward an inquiry to a buyer without separate sharing consent or documented later permission.

Create a Resend account, verify your sending domain, and obtain an API key. Create a Cloudflare Turnstile widget for your deployment hostname(s). Configure these in Cloudflare Pages → Settings → Variables and Secrets:

| Setting | Type | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Resend delivery credential |
| `INQUIRY_TO_EMAIL` | Variable | Inbox receiving inquiries and CSV attachments |
| `INQUIRY_FROM_EMAIL` | Variable | Verified Resend sender, e.g. `Climb Data Partners <inquiries@your-verified-domain>` |
| `TURNSTILE_SITE_KEY` | Variable | Public Turnstile widget key |
| `TURNSTILE_SECRET_KEY` | Secret | Server-side verification credential |

For local full-stack testing put these in ignored `.dev.vars`. Never commit credentials. Use Cloudflare's documented test widget keys for local testing, with matching site and secret keys; live keys must authorize the actual hostname. Without configuration the endpoint deliberately returns 503 and the UI does not claim success. Email delivery failure returns an actionable error. Tests mock external services; real email delivery still needs verification after configuration. API calls are exclusively `api.resend.com` and `challenges.cloudflare.com`. Browser spam checks also load from the latter. Restrict API access/abuse with additional Cloudflare rules if warranted. Submissions are not automatically retried, preventing silent duplicate delivery.

## Analytics and conversions

Set the public Cloudflare Web Analytics token in `public/config.js` to enable cookie-free aggregate analytics. Leaving it empty loads no analytics script. No advertising pixels or persistent campaign storage are used. UTM values are read from the current page URL only and attached to an inquiry.

After confirmed server acceptance, the browser dispatches `climb_inquiry_success` (rename with `conversionEvent` in config) as a `CustomEvent` on `window`, with campaign parameters only, no contact information. Integrations may subscribe with `window.addEventListener('climb_inquiry_success', handler)`. This is an integration hook, not a claim that Cloudflare Web Analytics records custom conversions. Connect a separately approved conversion destination if needed, update CSP and the privacy disclosure, and verify the event with a real submission. Do not add advertising tracking by default.

## Deployment — approval required

No Cloudflare deployment has been verified. No paid resources have been created. The owner has authorized an initial temporary `pages.dev` review deployment; production-domain publication remains unapproved.

1. Confirm the legal business name/address, public contact/privacy email, retention period/process, compensation disclosure, and draft legal text. Replace bracketed owner placeholders in the footer and legal pages. Approve Privacy Policy and Terms; remove their draft notices and `noindex` only after approval.
2. Configure the five settings above and optionally the analytics token. Confirm provider terms and any costs before enabling services.
3. Follow [DEPLOYMENT.md](DEPLOYMENT.md) to create a new Git-connected **Pages** review project using branch `cloudflare-pages-review`. Build command: `npm run build`; output directory: `public`; root directory: leave blank. Cloudflare deploys root `functions/` automatically. Use only the generated `pages.dev` address initially; do not create a Direct Upload project or overwrite an existing project.
4. Add `climbdatapartners.com` and optionally `www.climbdatapartners.com` as custom domains through Pages. Follow Cloudflare's DNS prompts; do not replace existing MX/email records. Choose the apex as canonical and configure a www-to-apex redirect. Activate the Turnstile hostname(s).
5. Submit a real inquiry on the approved deployment. Verify inbox delivery, CSV import, separate sharing consent, confirmation, UTM values, and optional conversion integration. Check mobile and desktop, legal links, HTTPS, and domain redirects.

`public/social.png` is the 1200×630 Open Graph image; `public/social.svg` is its editable source. All fonts and artwork are local/system-native. The geometric contour artwork is CSS, not a stock image. Privacy/Terms are explicit drafts for owner/legal review, not legal advice.
