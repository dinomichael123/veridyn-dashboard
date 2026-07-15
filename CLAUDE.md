# Veridyn Dashboard

Next.js 14 dashboard on Vercel (project `veridyn/dashboard`), Supabase backend
(`https://lktttrnthuhjirermuax.supabase.co`), synced by a local daemon in
`~/.claude/skills/daemon` (separate repo — not in this one).

- Deploy: `vercel --prod --yes` from this dir. Install with `npm ci --legacy-peer-deps`, never `npm install`.
- Env vars live in Vercel (Production scope): Supabase URL/anon/service-role, Anthropic, ElevenLabs.
- Data access: browser reads/writes with the **anon key** (`hooks/useRealtimeTable.ts`); API routes use the **service role** (`lib/supabase/server.ts`) and bypass RLS.
- RLS: every table needs anon policies or the UI silently renders empty. Add new tables to the arrays in `supabase/migrations/002_rls_policies.sql` and re-run it (idempotent).
- Migrations/DDL cannot run via REST or service-role key — paste into the Supabase SQL Editor.
- The live site is behind Vercel SSO deployment protection: `curl` returning 302/307 to vercel.com/login is normal, not an outage.
- VS Code shows syntax errors on `supabase/migrations/*.sql` — it's a T-SQL linter misreading Postgres; ignore.
