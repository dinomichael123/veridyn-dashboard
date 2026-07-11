# Deploy Checklist

## 1. Supabase Schema
Run `supabase/migrations/001_schema.sql` in your Supabase project's SQL Editor.

## 2. GitHub
```bash
cd C:\Users\dinom\.claude\skills\dashboard
git remote add origin https://github.com/YOUR_USERNAME/veridyn-dashboard.git
git push -u origin main
```

## 3. Vercel
1. Go to vercel.com → New Project → Import from GitHub
2. Select `veridyn-dashboard` repo
3. Add these Environment Variables in Vercel project settings:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API Key |

4. Deploy. Your dashboard will be at `https://YOUR_PROJECT.vercel.app`

## 4. Local Daemon
```bash
cd C:\Users\dinom\.claude\skills\daemon
copy .env.example .env
# Edit .env with your Supabase URL and service role key
npm install
node daemon.js   # test it works

# Auto-start at login (run as Administrator):
install-windows.bat
```

## 5. iPhone Access
Open `https://YOUR_PROJECT.vercel.app` in Safari → Share → Add to Home Screen.
Voice tab works with Safari's Web Speech API.
