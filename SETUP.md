# Cloud orders setup — Supabase `orders` table + EmailJS

Every checkout saves **directly into your Supabase `orders` table**, and the
admin **Orders** tab (at **/admin**) reads that same table — a true cloud
dashboard. Any order placed from any phone or computer shows up there after
you press **Refresh orders** (the list loads automatically once when the tab
opens; no auto-polling, so nothing spams the database).

There's **one required step** (the table + policies SQL), plus an optional
EmailJS step for email alerts.

> **Before any database changes:** your linked Supabase organization is
> currently disconnected in Dyad. Reconnect it from Dyad's Supabase settings
> before attempting provider operations — or simply run the SQL below
> yourself in the Supabase dashboard's SQL editor, which works the same.

---

## Step 1 — Create the `orders` table (2 minutes)

1. Open your Supabase project dashboard.
2. Go to **SQL Editor → New query**.
3. Paste the script below and click **Run**.

It creates the exact table the app writes to — `customer_name`,
`customer_phone`, `customer_address`, `payment_method`, `bkash_number`,
`bkash_trxid`, `items` (JSON), `total_price`, `status` — and locks it down
with row-level security so customers can place orders without an account.

```sql
-- Vindeshi orders table — run once in the Supabase SQL editor.
-- Safe to re-run: skips anything that already exists.

-- 1) The table (exact columns the app inserts)
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  customer_name     text not null,
  customer_phone    text not null,
  customer_address  text not null,
  payment_method    text not null,
  bkash_number      text,                 -- bKash / Rocket number paid from (nullable)
  bkash_trxid       text,                 -- bKash / Rocket transaction ID (nullable)
  items             jsonb not null default '[]',
  total_price       numeric not null default 0,
  status            text not null default 'Pending'
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- 2) Row-level security (mandatory for any public-facing table)
alter table public.orders enable row level security;

-- Customers can place orders at checkout — no account needed.
drop policy if exists "Anyone can place an order" on public.orders;
create policy "Anyone can place an order"
  on public.orders for insert
  to anon
  with check (true);

-- The admin Orders tab reads the table without a Supabase sign-in,
-- so every device running the dashboard sees the same list.
drop policy if exists "Orders are readable" on public.orders;
create policy "Orders are readable"
  on public.orders for select
  to anon
  using (true);

-- Status changes from the admin panel (update is limited to the
-- status column below, so nothing else can be modified publicly).
drop policy if exists "Order status can be updated" on public.orders;
create policy "Order status can be updated"
  on public.orders for update
  to anon
  using (true)
  with check (true);

-- 3) Grants — a separate security layer from RLS
revoke all on public.orders from anon, authenticated;
grant select, insert on public.orders to anon;
grant update (status) on public.orders to anon;  -- admin can only change status
```

**If you already created the table yourself:** just run the section 2 and 3
parts (policies + grants) so the app can read, insert, and update statuses.

### About this setup's privacy trade-off

So the dashboard works from any browser **without a Supabase sign-in**, this
grants the public (`anon`) role read access to the orders table — the same
posture as the old shared-cloud-store approach. That means anyone with the
site's URL can *technically* query order data (names, phones, addresses) via
the public API. Only the `status` column can be modified. If you'd rather
lock reads behind a Supabase account sign-in, swap the select/update
policies to `to authenticated` and ask me to re-add the sign-in gate to the
Orders tab.

**Never** put the service role key in the app — it stays server-side only.

---

## Step 2 — Email notifications with EmailJS (optional, 5 minutes)

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
bKash/Rocket number: {{bkash_number}}
TrxID: {{transaction_id}}

Items:
{{items_ordered}}

Total: {{total}}
```

Until you finish this step the app still works — orders are saved to the
Supabase table, emails are just skipped.

---

## Test it

1. Place a test order from the storefront checkout (pick bKash, enter a test
   number and TrxID to see that flow).
2. Open **/admin** (on any device), unlock with your admin password, go to
   **Orders** — the order is in the list.
3. Place another order from a different browser/phone, press **Refresh
   orders** in the open panel — it appears.
4. Change an order's status, reload from another device — it persisted.

## How it works

- Checkout inserts **directly** into the Supabase `orders` table with the
  exact columns listed above — `id` and `created_at` are assigned by the
  database, and the customer's confirmation shows that database id.
- The admin Orders tab fetches the table **once when it opens**, and the
  **Refresh orders** button pulls the latest on demand. No intervals, no
  background polling — nothing can spam the API or trigger rate limits.
- The panel is fully cloud-based: no order data is read from the browser's
  localStorage anymore.
- Status changes write straight to the database (optimistic in the UI,
  verified by a refresh afterwards).
- If the database can't be reached at checkout, the customer sees a clear
  error and can retry — the cart is kept, nothing is silently lost.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Orders tab says the orders table isn't set up | Run the step 1 SQL script, then press Try again |
| Checkout shows "We couldn't save your order" | Run the step 1 SQL (insert policy/columns), then retry |
| Orders list is empty although orders were placed | Press **Refresh orders**; if still empty, the select policy from step 1 is missing |
| Status change shows an error | The update policy or `grant update (status)` from step 1 is missing |
| Orders appear with wrong/old data | Check the table columns match step 1 exactly (`bkash_number`, `bkash_trxid`, `total_price`, `items`) |
| No email arrives | Check the three constants in `src/lib/email.ts`, and that the template's **To email** is set to your address |
