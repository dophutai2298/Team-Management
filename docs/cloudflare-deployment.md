# Cloudflare Deployment

This app deploys to Cloudflare Workers through OpenNext.

## Commands

Use OpenNext for both build and deploy. Do not deploy this app with `wrangler deploy`
directly unless `.open-next/worker.js` already exists in the same environment.

For Cloudflare Workers Builds, configure:

```text
Build command: npm run cf:build
Deploy command: npm run cf:deploy
```

For a one-command local or CI deployment:

```sh
npm run deploy
```

## Files

Commit these deployment files:

```text
open-next.config.ts
wrangler.jsonc
package.json
package-lock.json
```

Do not commit generated build output:

```text
.next/
.open-next/
node_modules/
```

OpenNext creates `.open-next/worker.js` during `npm run cf:build`.
