# Project rules

- Stack: Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, MongoDB with Mongoose, Zod, jose (JWT), bcryptjs, cheerio, recharts (later).
- Styling: hardcoded Tailwind classes only. No CSS variables, no custom theme CSS.
- “Today” and date ranges use timezone Asia/Karachi.
- All API routes need auth except `/api/auth/login`, `/api/health` and `/api/cron/*`.
- Validate all inputs with Zod. API responses are `{ ok: true, data }` or `{ ok: false, error }`.
- Read env vars only through `lib/env.ts`. Never log or return secrets.
- Lead upserts must keep `placeId` unique and never overwrite `stage`, `notes` or `ownerName`.
- Only touch files listed in the current task. Do not add unrelated packages.
- Before finishing a task, `npm run lint` and `npm run build` must pass. End with a list of changed files.
