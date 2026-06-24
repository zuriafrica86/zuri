// Envoi d'emails via l'API Resend (compatible Cloudflare Workers via fetch).
// Tout échec est silencieux : une notif ratée ne doit jamais bloquer une action.

const RESEND_URL = "https://api.resend.com/emails";

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "ZURI <onboarding@resend.dev>";
  if (!key) return; // pas encore configuré → on n'envoie rien
  try {
    await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
  } catch {
    // ignoré volontairement
  }
}

function appUrl(path = ""): string {
  const base = process.env.APP_URL || "";
  return `${base}${path}`;
}

function layout(title: string, body: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<a href="${cta.href}" style="display:inline-block;background:#C9892F;color:#2A1A12;text-decoration:none;padding:12px 22px;border-radius:14px;font-weight:600;margin-top:18px">${cta.label}</a>`
    : "";
  return `
  <div style="background:#F7F0E6;padding:28px;font-family:Helvetica,Arial,sans-serif;color:#2A1A12">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:18px;padding:28px">
      <p style="font-size:22px;font-weight:700;letter-spacing:1px;margin:0 0 18px">ZURI</p>
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      <div style="font-size:15px;line-height:1.55;color:#4a3a30">${body}</div>
      ${button}
    </div>
    <p style="text-align:center;color:#9b8a7c;font-size:12px;margin-top:16px">ZURI — beauté locale, Gabon</p>
  </div>`;
}

// → à la coiffeuse : nouvelle demande de RDV
export async function notifyNewBooking(
  to: string,
  data: { serviceName: string; dateLabel: string }
) {
  await sendEmail({
    to,
    subject: "Nouvelle demande de RDV sur ZURI 💇🏾‍♀️",
    html: layout(
      "Tu as une nouvelle demande de RDV",
      `<p>Une cliente souhaite un rendez-vous :</p>
       <p><strong>${data.serviceName}</strong><br/>Date souhaitée : ${data.dateLabel}</p>
       <p>Connecte-toi pour confirmer ou refuser. Ton numéro ne sera communiqué qu'après confirmation.</p>`,
      { label: "Voir la demande", href: appUrl("/dashboard/rdv") }
    ),
  });
}

// → à la cliente : RDV confirmé
export async function notifyBookingConfirmed(
  to: string,
  data: { coiffeuseName: string }
) {
  await sendEmail({
    to,
    subject: "Ton RDV est confirmé 🎉",
    html: layout(
      "Bonne nouvelle, ton RDV est confirmé !",
      `<p><strong>${data.coiffeuseName}</strong> a confirmé ton rendez-vous.</p>
       <p>Tu peux maintenant récupérer son contact WhatsApp depuis ton espace.</p>`,
      { label: "Contacter ma coiffeuse", href: appUrl("/dashboard/mes-rdv") }
    ),
  });
}

// → à la cliente : RDV refusé
export async function notifyBookingRefused(
  to: string,
  data: { coiffeuseName: string }
) {
  await sendEmail({
    to,
    subject: "Mise à jour de ta demande de RDV",
    html: layout(
      "Ta demande n'a pas pu être acceptée",
      `<p><strong>${data.coiffeuseName}</strong> n'est pas disponible pour cette demande.</p>
       <p>Pas d'inquiétude — d'autres coiffeuses t'attendent sur ZURI.</p>`,
      { label: "Découvrir d'autres coiffeuses", href: appUrl("/recherche") }
    ),
  });
}
