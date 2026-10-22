# Data Lab

The Data Lab on its own: the same volunteer app as `web/`'s `/data-lab`, in
black and white with a light/dark toggle, and nothing on the front page but a
Sign in button. It is deployed apart from the site and shares its backend and
Firebase project, so volunteers, contributions and reviews are the same in both.

```bash
cp .env.example .env.local   # values from web/.env.local
pnpm install
pnpm dev                     # → http://localhost:3001
```

| Route | Page |
|---|---|
| `/` | Sign in button; signed-in volunteers go to `/workspace` |
| `/sign-in` | Google or email sign-in |
| `/welcome` | Joining, adding languages, accepting new consent |
| `/workspace` | A volunteer's languages and progress |
| `/contribute/[lang]`, `/review/[lang]` | Writing, recording and reviewing |

## Deploying

- Set the variables in `.env.example`. `NEXT_PUBLIC_` values are inlined at
  build time, so set them before `next build`.
- Add this app's origin to the backend's `CORS_ALLOWED_ORIGINS` and
  `BLUEPRINT_WS_ALLOWED_ORIGIN` (both comma-separated).
- Add its domain in Firebase Console → Authentication → Settings → Authorized
  domains, or Google sign-in is refused.

## Keeping it in step with web/

The components in `components/` are copies of `web/components/data-lab/`,
restyled. A change to the Data Lab's behaviour belongs in both. `consent.ts`
in particular must match the backend's `domain.CurrentConsentVersion`, as in
`web/`.
