import emailjs from '@emailjs/browser';
import type { Order } from './local-store';

/**
 * EmailJS order notifications (free tier: 200 emails/month).
 *
 * The email recipient ("To email") is set inside your EmailJS dashboard
 * template — never in this file — so the public key can't be abused to
 * send emails to arbitrary addresses.
 *
 * One-time setup (~5 minutes, see SUPABASE_SETUP.md step 3):
 *  1. Create an account at https://www.emailjs.com/
 *  2. Email Services → connect your email provider → copy the Service ID
 *  3. Email Templates → create a template using the variables below
 *     (subject, content and "To email" are listed in SUPABASE_SETUP.md)
 *     → copy the Template ID
 *  4. Account → General → copy your Public Key
 *  5. Fill in the three constants below.
 *
 * Until configured, emails are skipped silently — orders still save to
 * the cloud database either way.
 */

const EMAILJS_SERVICE_ID = ''; // e.g. 'service_xxxxxxx'
const EMAILJS_TEMPLATE_ID = ''; // e.g. 'template_xxxxxxx'
const EMAILJS_PUBLIC_KEY = ''; // e.g. 'AbC123xyz…'

const formatTk = (amount: number) => `Tk ${amount.toLocaleString('en-US')}`;

/** Email the store owner the full details of a newly placed order. */
export async function sendOrderNotification(order: Order): Promise<void> {
  if (!isEmailConfigured()) return;

  const itemsList =
    order.items
      .map((item) => `• ${item.name} (${item.color}) × ${item.qty} — Tk ${item.price}`)
      .join('\n') || '• (no items)';

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      order_id: order.id,
      customer_name: order.customerName,
      customer_email: order.email,
      customer_phone: order.phone,
      delivery_address: order.address,
      payment_method: order.paymentMethod,
      transaction_id: order.transactionId || '—',
      items_ordered: itemsList,
      subtotal: formatTk(order.subtotal),
      delivery_fee: order.deliveryFee === 0 ? 'Free' : formatTk(order.deliveryFee),
      total: formatTk(order.total),
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}
