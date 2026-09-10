# Cloud orders setup — shared JSON storage + EmailJS

Your store saves every order to **one shared JSON document in the cloud** and
(optionally) emails you the full order details the moment it's placed. The
admin **Orders** tab reads from that shared document and refreshes
**automatically** — every 8 seconds — so orders placed from any device, by
anyone, appear in your dashboard live.

The shared storage runs on **jsonblob.com** — a free, keyless JSON storage
API. No accounts, no API keys, no database setup. There's **one step** for
cloud orders, plus an optional EmailJS step for email alerts.

---

## Step 1 — Connect the shared cloud store (1 minute)

1. Open your admin dashboard at **/admin** (unlock with your admin password).
2. Go to the **Orders** tab. The first time, it shows a setup panel.
3. Click **Create cloud store** — it creates the shared orders document and
   links this browser instantly.
4. **Copy the store ID** it shows, then:
   - open `src/lib/orders.ts` in the app,
   - paste the ID into the `ORDERS_BLOB_ID` constant at the top,
   - rebuild and redeploy.

Why the paste step? The blob ID acts as the store's address — baking it into
the build means **every visitor's checkout, from any device**, saves to the
same shared store. (Until you redeploy, only browsers that linked the ID —
like this one — can see and write the store.)

5. To open the dashboard on **another** browser/device: go to its Orders tab
   and use **Link an existing store** with the same ID (or full
   `https://jsonblob.com/<id>` URL). You can copy the ID anytime with the
   **Copy ID** button in the dashboard's status strip.

> **Prefer a manual store?** Visit <https://jsonblob.com>, paste
> `{"orders": []}` into the editor, click **Create**, and link the resulting
> URL in the setup panel instead. Both paths end the same way.

Once linked, the Orders tab polls the shared store every 8 seconds (and on
window focus) — new orders appear automatically. The **Refresh orders**
button forces an immediate sync whenever you want it.

### Orders while offline

If the store can't be reached at checkout, the order is saved on that
device instead — never lost. The admin Orders tab marks such orders with a
**This device** badge and offers a one-click **Upload to cloud** button.

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
TrxID: {{transaction_id}}

Items:
{{items_ordered}}

Subtotal: {{subtotal}}
Delivery: {{delivery_fee}}
Total: {{total}}
```

Until you finish this step the app still works — orders are saved to the
shared cloud store, emails are just skipped.

---

## Test it

1. Place a test order from the storefront checkout (pick bKash and enter a test
   TrxID to see that flow).
2. Check your email inbox — the notification should arrive within a minute
   (if you set up step 2).
3. Open **/admin** (on any device), unlock with your admin password, go to
   **Orders** — your order is there.
4. Place another order in a different browser — it appears in the open panel
   within seconds, no refresh needed (or press **Refresh orders**).
5. Change an order's status, reload from another device, and confirm it
   persisted.

## How it works

- All orders live in one shared JSON document (`{"orders": [...]}`) hosted on
  jsonblob.com. The document's ID is its only "credential": treat it as
  semi-private. Anyone with the ID can read or write that document — nothing
  else in your store is affected.
- Checkout **fetches the current list, merges the new order in, and writes
  the whole document back** — so orders placed from multiple devices are all
  kept. (Two checkouts submitting in the same instant could lose one to a
  race — for a small store this is extremely rare, the order also emails you
  if EmailJS is configured, and the browser fallback keeps it on the
  customer's device.)
- The admin tab updates statuses by rewriting the document with the change —
  optimistic in the UI, then verified by a hard refresh.
- All reads are defensively parsed, so malformed or malicious edits to the
  public document can't break the dashboard (bad rows are skipped, missing
  fields fall back to safe defaults).

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Orders tab shows the setup panel | No store linked yet — do step 1 |
| "No cloud store exists with that ID" (404) | The document was deleted — create a new store, update `ORDERS_BLOB_ID`, and re-link other browsers |
| "Cloud store responded with 429" | Too many requests in a short window — wait ~30s and press Refresh orders (polling pauses while the tab is hidden) |
| New orders don't appear | Press **Refresh orders**; check the ID matches across devices |
| Order says it was saved "on this device" | The cloud was unreachable at checkout — use **Upload to cloud** in the Orders tab |
| Orders look wrong / fields are empty | The public document may have been edited — the dashboard skips malformed rows, so only valid orders show |
| No email arrives | Check the three constants in `src/lib/email.ts`, and that the template's **To email** is set to your address |
