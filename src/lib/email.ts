import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? "TDSSNEAKERS <onboarding@resend.dev>";

export const isEmailConfigured = Boolean(apiKey && apiKey.length > 0);

const resend = apiKey ? new Resend(apiKey) : null;

interface OrderEmailData {
  reference: string;
  customerName: string;
  email: string;
  items: { name: string; size: string; quantity: number; unitPrice: number }[];
  total: number;
}

function itemsTable(items: OrderEmailData["items"]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${i.name} (T. ${i.size}) × ${i.quantity}</td><td style="padding:6px 0;text-align:right;">${i.unitPrice * i.quantity} $</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>`;
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `Confirmation de commande ${data.reference} — TDSSNEAKERS`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <h1 style="font-size:20px;">Merci pour ta commande, ${data.customerName} 👟</h1>
          <p style="color:#555;font-size:14px;">Ta commande <strong>${data.reference}</strong> a bien été reçue et est en cours de préparation.</p>
          ${itemsTable(data.items)}
          <p style="text-align:right;font-weight:bold;font-size:16px;border-top:1px solid #eee;padding-top:10px;">Total : ${data.total} $ CAD</p>
          <p style="color:#888;font-size:12px;">TDSSNEAKERS — Sneakers. Style. Attitude.</p>
        </div>
      `,
    });
  } catch {
    // Non-blocking: email failure must not break order processing.
  }
}

export async function sendShippingNotification(
  email: string,
  customerName: string,
  reference: string
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Ta commande ${reference} a été expédiée — TDSSNEAKERS`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <h1 style="font-size:20px;">Bonne nouvelle, ${customerName} !</h1>
          <p style="color:#555;font-size:14px;">Ta commande <strong>${reference}</strong> vient d'être expédiée. Elle arrive bientôt.</p>
          <p style="color:#888;font-size:12px;">TDSSNEAKERS — Sneakers. Style. Attitude.</p>
        </div>
      `,
    });
  } catch {}
}
