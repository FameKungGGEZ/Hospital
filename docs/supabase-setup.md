# Supabase Setup

## 1. Local App Keys

In the Supabase Dashboard, open the project settings and copy the Project URL and publishable/anon key into the ignored `.env.local` file:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

These are the only Supabase values allowed in the browser app. Never put the service-role key in a `VITE_` variable or commit it.

## 2. Database Migrations

Apply migrations in order from the Supabase SQL Editor or the Supabase CLI:

1. `supabase/migrations/202609280001_initial_schema.sql`
2. `supabase/migrations/202609280002_student_roster_rollover.sql`

The second migration archives the previously active academic records and upserts the new roster in one transaction. Old academic records and service records remain available for reports and history.

## 3. First Admin Account

1. In Supabase Authentication, create or invite the staff Auth account using its school email and a newly chosen password.
2. Copy that Auth user's UUID from the Dashboard.
3. Insert the matching profile in the SQL Editor, replacing the placeholders:

```sql
insert into public.users (id, username, display_name, role, active)
values ('<auth-user-uuid>', '<username>', '<staff-display-name>', 'admin', true);
```

The username login function resolves the username to this Auth user and then verifies the password with Supabase Auth. The password is never stored in `public.users`.

## 4. Edge Functions

Deploy these functions after linking the CLI to the Supabase project:

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase functions deploy username-login
npx supabase functions deploy student-lookup
npx supabase functions deploy service-submit
```

Supabase provides the function runtime's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must only be used in Edge Function runtime secrets.

## 5. Vercel

Import the repository into Vercel and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the project's Environment Variables for Preview and Production. Deploy a Preview first; only promote it after roster import, staff login, student lookup, service submission, history, statistics, and export have been checked.

## 6. Data and Privacy

- Upload the approved academic-year roster only after the staging project and admin account are ready.
- The roster rollover operation does not delete prior-year academic records or service history.
- Reset any password previously shared outside the password manager before creating the production Auth account.
- Configure an allowed website origin and rate limits for public Edge Functions before public production traffic.