# Get a database connection string for GoalMuse backend on Vercel

The **Vercel MCP cannot create a database** or return a connection string. You create the database in the Vercel Dashboard and connect it to your project; the connection string is then available as an environment variable.

---

## Option A: Neon (recommended by Vercel)

1. **Open your project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard).
   - Select team **k_isom projects** (or the team that owns `goal-muse-backend`).
   - Open the **goal-muse-backend** project.

2. **Add a Postgres database**
   - In the project, open the **Storage** tab, or go to [Vercel Marketplace → Postgres](https://vercel.com/marketplace?category=storage&search=postgres).
   - Choose **Neon** (or another Postgres provider).
   - Click **Add** / **Install** and follow the prompts to create a new database (or connect an existing one).
   - When asked, **connect the database to this project** (`goal-muse-backend`).

3. **Get the connection string**
   - After the integration is connected, Vercel injects env vars into the project.
   - Go to **Project → Settings → Environment Variables**.
   - You should see **`POSTGRES_URL`** or **`DATABASE_URL`** (name depends on the integration).
   - If the integration uses `POSTGRES_URL`, add a variable **`DATABASE_URL`** with the **same value** as `POSTGRES_URL`, so the GoalMuse backend (which reads `DATABASE_URL`) can use it.
   - Apply to **Production** (and Preview if you want).

4. **Redeploy**
   - Trigger a new deployment (e.g. **Deployments → … → Redeploy**) so the new env vars are used.

5. **Run migrations and seed (one-time)**
   - The backend uses SQLAlchemy; tables are often created on first run or via a migration script.
   - If you have a seed script for the demo user (`demo@goalmuse.app`), run it against the new database (e.g. locally with `DATABASE_URL` set to the same URL, or via a one-off deploy/script).

---

## Option B: External Postgres (e.g. Supabase, Railway)

1. Create a Postgres database with your chosen provider and copy the **connection string** (e.g. `postgresql://user:password@host:5432/dbname?sslmode=require`).
2. In **goal-muse-backend** on Vercel: **Settings → Environment Variables**.
3. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** your connection string (paste the full URL).
   - **Environment:** Production (and Preview if needed).
4. Save and redeploy.

---

## Summary

| Step | Action |
|------|--------|
| 1 | In Vercel, open **goal-muse-backend** → **Storage** or **Marketplace** → add Postgres (e.g. Neon). |
| 2 | Connect the database to the project so env vars are injected. |
| 3 | Ensure **`DATABASE_URL`** exists (copy from `POSTGRES_URL` if the integration uses that name). |
| 4 | Set **`SECRET_KEY`** in env vars (required for login). |
| 5 | Redeploy and run migrations/seed if needed. |

Your backend project: **goal-muse-backend**  
Production URL: **https://goal-muse-backend.vercel.app**
