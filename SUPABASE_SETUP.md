# Cloud orders setup — Supabase + EmailJS

Your store now saves every order to a **Supabase cloud database** and (optionally)
emails you the full order details the moment it's placed. The admin **Orders** tab
reads straight from the cloud and updates **live** on any device you sign in from.

There are **three one-time steps** (about 10 minutes total), done in your
Supabase and EmailJS dashboards.

> **Before any database changes:** your linked Supabase organization is currently
> disconnected in Dyad. Reconnect it from Dyad's Supabase settings before attempting
> provider operations — or simply run the SQL below yourself in the Supabase
> dashboard, which works the same either way.

---

## Step 1 — Create the `orders` table (2 minutes)

1. Open your Supabase project dashboard.
2. Go to **SQL Editor → New query**.
3. Paste the script below and click **Run**.

It creates the orders table, turns on realtime updates, and locks the table down
with row-level security so **customers can place orders but can never read or
modify anyone's order**.

```sql
-- Vindeshi cloud orders — run once in the Supabase SQL editor.

-- 1) The orders table
create table if not exists public.orders (
  id             text primary key,
  created_at     timestamptz not null default now(),
  customer_name  text        not null,
  email          text        not null,
  phone          text        not null,
  address        text        not null,
  payment_method text        not null,
  transaction_id text,                    -- bKash / Rocket TrxID (nullable)
  items          jsonb       not null default '[]',
  subtotal       numeric     not null default 0,
  delivery_fee   numeric     not null default 0,
  total          numeric     not null default 0,
  status         text        not null default 'Pending'
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- 2) Realtime: pushes new/changed orders to the admin panel instantly
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null; -- already added — fine
end $$;

-- 3) Row-level security (mandatory for any public-facing table)
alter table public.orders enable row level security;

-- Public visitors can PLACE orders but can never read or modify them.
drop policy if exists "Public can place orders" on public.orders;
create policy "Public can place orders"
  on public.orders for insert
  to anon
  with check (true);

-- Only signed-in users (you) can view orders.
drop policy if exists "Signed-in users can view orders" on public.orders;
create policy "Signed-in users can view orders"
  on public.orders for select
  to authenticated
  using (true);

-- Only signed-in users can update orders (status changes).
drop policy if exists "Signed-in users can update orders" on public.orders;
create policy "Signed-in users can update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

-- 4) Grants — a separate security layer from RLS
revoke all on public.orders from anon, authenticated;
grant insert on public.orders to anon;
grant select, update on public.orders to authenticated;
```

**Optional extra hardening:** the policies above let *any* Supabase account you
create view orders. If you plan to create more accounts, restrict order access
to a single admin email instead:

```sql
drop policy if exists "Signed-in users can view orders" on public.orders;
create policy "Signed-in users can view orders"
  on public.orders for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'your-admin-email@example.com');
```

---

## Step 2 — Create your admin sign-in (1 minute)

The admin dashboard's Orders tab asks you to sign in with a **Supabase account**.
That's what keeps your customers' order data private while letting you in from
any device.

1. In Supabase go to **Authentication → Users → Add user**.
2. Enter your email and a password, tick **Auto Confirm User**, and save.

> Any orders placed before the upgrade (or while offline) are kept in your
> browser — the Orders tab shows a one-click **Upload to cloud** button for them
> once you're signed in.

---

## Step 3 — Email notifications with EmailJS (5 minutes)

Free tier: **200 emails/month**.

1. Create an account at <https://www.emailjs.com>.
2. **Email Services → Add New Service** → connect Gmail (or your provider) →
   **Create Service** → copy the **Service ID**.
3. **Email Templates → Create New Template**:
   - **To email:** *your own email address* (the inbox where you want order
     alerts). Keep it fixed here — don't use a `{{to_email}}` variable.
   - **Reply To (optional):** `{{customer_email}}` so you can reply to buyers
     directly.
   - **Subject:** `New order {{order_id}} — {{total}}`
   - **Content:** paste the template below.
   - Save → copy the **Template ID**.
4. **Account → General** → copy your **Public Key**.
5. Open `src/lib/email.ts` in the app and fill in the three constants at the
   top: `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`.

Template content to paste (uses exactly the variables the app sends):

```text
New order placed on your store.

Customer: {{customer_name}}
Phone: {{customer_phone}}
Email: {{customer_email}}
Delivery address: {{delivery_address}}

Payment: {{payment_method}}
TrxID: {{transaction_id}}

Items:
{{items_ordered}}

Subtotal: {{subtotal}}
Delivery: {{delivery_fee}}
Total: {{total}}
```

Until you finish this step the app still works — orders are saved to the cloud,
emails are just skipped.

---

## Test it

1. Place a test order from the storefront checkout (pick bKash and enter a test
   TrxID to see that flow).
2. Check your email inbox — the notification should arrive within a minute.
3. Open **/admin** (on any device), unlock with your admin password, go to
   **Orders**, and sign in with the Supabase account from step 2 — your order
   is there.
4. Place another order in a different browser — it appears **live** in the open
   panel, no refresh needed.
5. Change an order's status, reload from another device, and confirm it
   persisted.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Orders tab says the orders table doesn't exist | Run the step 1 SQL script, then reload |
| "Invalid login credentials" | Create the user first (step 2) |
| No email arrives | Check the three constants in `src/lib/email.ts`, and that the template's **To email** is set to your address |
| New orders don't appear live | Re-run the step 1 SQL (the realtime section), then reload the admin page |
| Order says it was saved "on this device" | The cloud was unreachable at checkout — the order is kept locally; sign in and use **Upload to cloud** in the Orders tab |
