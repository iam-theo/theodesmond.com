# Supabase backend — setup guide

This site uses Supabase as its realtime backend. When configured, the blog
posts, comments, reactions and contact submissions all live in your Supabase
project and are manageable from the **Supabase Studio** portal. Without it,
the site gracefully falls back to the bundled local data + localStorage.

## 1. Create the project

1. Go to https://supabase.com and create an account if you don't have one.
2. Create a new project (name it e.g. `theodesmond`), pick a region near your
   audience, and note the database password.
3. Wait for provisioning to finish.

## 2. Apply schema + seed

Two ways:

**Via the CLI (recommended when using this repo)**

```
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This applies `supabase/migrations/0001_schema.sql` (tables, RLS, realtime) and
`0002_seed.sql` (your 4 essays, generated from `src/data.js`).

**Via the SQL Editor (manual)**

1. In Supabase Studio, open **SQL Editor**.
2. Paste and run `supabase/migrations/0001_schema.sql`.
3. Paste and run `supabase/migrations/0002_seed.sql`.

To re-sync the database whenever you edit posts in `src/data.js`:

```
npm run db:seed
```

...then apply the regenerated `0002_seed.sql` (`supabase db push`).

## 3. Connect the app

1. In Supabase Studio go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key.
3. In the project root, copy `.env.example` to `.env` and fill it in:

   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart `npm run dev`. The blog will now load from the database, and a
   green **Live** badge appears next to Comments.

## 4. Using the portal (easy modification)

Everything is editable in **Supabase Studio**:

- **Posts** — Table Editor → `posts`. Edit `title`, `excerpt`, `blocks`
  (the essay JSON), `sort_order` (lower = higher on the blog), or set
  `status` to anything you like. New posts appear automatically on the blog.
- **Comments / replies** — Table Editor → `comments`. Delete spam; changes
  stream to the site in real time.
- **Reactions** — `post_reactions` and `comment_reactions`.
- **Contact form submissions** — Table Editor → `contacts`. Public visitors
  can insert, only staff (authenticated) can read.

## Notes

- The anon key is safe to expose in the browser — RLS governs what visitors
  can do (insert comments/reactions/contacts, read posts).
- When you deploy, make sure the `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` env vars are set on your host.
- If the `posts` table is empty the site falls back to the bundled essays, so
  nothing breaks before your first seed.
