// Envoi d'emails via l'API Resend (compatible Cloudflare Workers via fetch).
// Tout échec est silencieux : une notif ratée ne doit jamais bloquer une action.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  TOUS LES MODÈLES D'EMAILS DE ZURI SONT DANS CE FICHIER.               │
// │  - Le look commun (logo, couleurs, bouton) est dans layout().          │
// │  - Chaque fonction notify…() = un email : son sujet + son contenu.     │
// │  Pour changer le style global → layout(). Pour un texte → la fonction. │
// │  (L'email de CONFIRMATION D'INSCRIPTION est géré par Supabase, pas ici;│
// │   son modèle est dans supabase/email-templates/confirmation.html.)     │
// └──────────────────────────────────────────────────────────────────────┘

import { WELCOME_BONUS, formatZuri } from "@/lib/credit";

const RESEND_URL = "https://api.resend.com/emails";

// ----- Couleurs de marque (réutilisées dans le gabarit) -----
const IVOIRE = "#F7F0E6";
const CACAO = "#2A1A12";
const OR = "#E2B0A0";
const SABLE = "#EBD9CF";

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Zuri <onboarding@resend.dev>";
  if (!key || !opts.to) return; // pas configuré ou pas de destinataire → rien
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
        ...(opts.text ? { text: opts.text } : {}),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
  } catch {
    // ignoré volontairement
  }
}

function appUrl(path = ""): string {
  const base = process.env.APP_URL || "https://zuriafrica.app";
  return `${base}${path}`;
}

function adminEmail(): string {
  // Adresse qui reçoit les alertes admin. À définir dans Cloudflare (RUNTIME).
  return process.env.ADMIN_EMAIL || "";
}

// Encadré beige pour mettre en avant une info (service, date, nom…).
function infoBox(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;background:#FBF6EE;border:1px solid ${SABLE};border-radius:12px"><tr><td style="padding:14px 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:${CACAO}">${html}</td></tr></table>`;
}

// Gabarit commun à tous les emails Zuri.
function layout(opts: {
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
}): string {
  const { title, bodyHtml, cta, footerNote } = opts;
  const logo = appUrl("/logo-zuri.png");

  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 4px"><tr><td align="center" style="border-radius:14px;background:${OR}"><a href="${cta.href}" style="display:inline-block;padding:13px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:${CACAO};text-decoration:none;border-radius:14px">${cta.label}</a></td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Zuri</title></head>
<body style="margin:0;padding:0;background:${IVOIRE}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVOIRE}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:520px;max-width:100%;background:#ffffff;border-radius:20px;border:1px solid ${SABLE}">
        <tr><td style="padding:30px 34px 14px;text-align:center">
          <img src="${logo}" alt="Zuri" width="118" style="display:inline-block;width:118px;height:auto;border:0;outline:none;text-decoration:none" />
        </td></tr>
        <tr><td style="padding:0 34px"><div style="height:1px;background:#f1e8da;line-height:1px;font-size:0">&nbsp;</div></td></tr>
        <tr><td style="padding:22px 34px 32px">
          <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.3;color:${CACAO};font-weight:700">${title}</h1>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#5a4a3e">${bodyHtml}</div>
          ${button}
        </td></tr>
      </table>
      <p style="margin:18px auto 0;max-width:520px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a9988a;text-align:center">
        ${footerNote ? footerNote + "<br/>" : ""}
        Zuri — la beauté près de chez toi.<br/>
        <a href="${appUrl("")}" style="color:${OR};text-decoration:none">zuriafrica.app</a>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

/* ====================================================================== */
/*  1. À la ZURISTE — nouvelle demande de RDV                              */
/* ====================================================================== */
export async function notifyNewBooking(
  to: string,
  data: { serviceName: string; dateLabel: string }
) {
  await sendEmail({
    to,
    subject: "Nouvelle demande de rendez-vous",
    text: `Tu as une nouvelle demande de RDV : ${data.serviceName}, le ${data.dateLabel}. Connecte-toi pour confirmer : ${appUrl("/dashboard/rdv")}`,
    html: layout({
      title: "Tu as une nouvelle demande de rendez-vous",
      bodyHtml: `<p style="margin:0 0 8px">Bonne nouvelle — une cliente souhaite réserver avec toi&nbsp;:</p>
        ${infoBox(`<strong>${data.serviceName}</strong><br/><span style="color:#7a6a5c">Date souhaitée&nbsp;: ${data.dateLabel}</span>`)}
        <p style="margin:14px 0 0">Connecte-toi pour confirmer ou refuser. Ton numéro ne sera communiqué à la cliente qu'<strong>après ta confirmation</strong>.</p>`,
      cta: { label: "Voir la demande", href: appUrl("/dashboard/rdv") },
    }),
  });
}

/* ====================================================================== */
/*  2. À la CLIENTE — RDV confirmé                                         */
/* ====================================================================== */
export async function notifyBookingConfirmed(
  to: string,
  data: { coiffeuseName: string }
) {
  await sendEmail({
    to,
    subject: "Ton rendez-vous est confirmé",
    text: `${data.coiffeuseName} a confirmé ton rendez-vous. Récupère son contact dans ton espace : ${appUrl("/dashboard/mes-rdv")}`,
    html: layout({
      title: "Ton rendez-vous est confirmé",
      bodyHtml: `<p style="margin:0 0 8px"><strong>${data.coiffeuseName}</strong> a confirmé ton rendez-vous.</p>
        <p style="margin:0">Tu peux maintenant récupérer son contact WhatsApp depuis ton espace pour finaliser les détails ensemble.</p>`,
      cta: { label: "Contacter ma Zuriste", href: appUrl("/dashboard/mes-rdv") },
    }),
  });
}

/* ====================================================================== */
/*  3. À la CLIENTE — RDV refusé                                           */
/* ====================================================================== */
export async function notifyBookingRefused(
  to: string,
  data: { coiffeuseName: string }
) {
  await sendEmail({
    to,
    subject: "Mise à jour de ta demande de rendez-vous",
    text: `${data.coiffeuseName} n'est pas disponible pour cette demande. Découvre d'autres Zuristes : ${appUrl("/recherche")}`,
    html: layout({
      title: "Ta demande n'a pas pu être acceptée",
      bodyHtml: `<p style="margin:0 0 8px"><strong>${data.coiffeuseName}</strong> n'est pas disponible pour cette demande.</p>
        <p style="margin:0">Pas d'inquiétude&nbsp;: plein d'autres Zuristes t'attendent sur Zuri.</p>`,
      cta: {
        label: "Découvrir d'autres Zuristes",
        href: appUrl("/recherche"),
      },
    }),
  });
}

/* ====================================================================== */
/*  4. À la ZURISTE — profil validé (bienvenue)                           */
/* ====================================================================== */
export async function notifyProviderApproved(
  to: string,
  data: { coiffeuseName: string }
) {
  const hello = data.coiffeuseName ? `${data.coiffeuseName}, ` : "";
  await sendEmail({
    to,
    subject: "Bienvenue sur Zuri — ton profil est validé",
    text: `Ton profil Zuriste est validé et visible. Tu démarres avec ${formatZuri(WELCOME_BONUS)} offerts. Accède à ton espace : ${appUrl("/dashboard")}`,
    html: layout({
      title: "Ton profil est validé",
      bodyHtml: `<p style="margin:0 0 10px">${hello}félicitations&nbsp;! Ton profil vient d'être validé&nbsp;: tu es désormais <strong>visible</strong> par les clientes sur Zuri.</p>
        ${infoBox(`<strong>${formatZuri(WELCOME_BONUS)} offerts</strong> pour démarrer<br/><span style="color:#7a6a5c">de quoi recevoir tes premières clientes sans frais.</span>`)}
        <p style="margin:14px 0 0">Pense à compléter tes services, ton portfolio et tes disponibilités pour donner envie&nbsp;!</p>`,
      cta: { label: "Accéder à mon espace", href: appUrl("/dashboard") },
    }),
  });
}

/* ====================================================================== */
/*  5. À l'ADMIN — nouvelle Zuriste à valider                             */
/*     (n'envoie rien tant que ADMIN_EMAIL n'est pas défini)              */
/* ====================================================================== */
export async function notifyAdminNewProvider(data: {
  prenom: string;
  nom: string;
  email: string;
}) {
  const to = adminEmail();
  if (!to) return;
  const fullName = `${data.prenom} ${data.nom}`.trim();
  await sendEmail({
    to,
    subject: "Nouvelle Zuriste à valider",
    text: `Nouvelle inscription Zuriste : ${fullName} (${data.email}). À valider dans l'admin : ${appUrl("/admin/zuristes")}`,
    html: layout({
      title: "Une nouvelle Zuriste s'est inscrite",
      bodyHtml: `<p style="margin:0 0 8px">Un nouveau compte Zuriste vient d'être créé et attend ta validation&nbsp;:</p>
        ${infoBox(`<strong>${fullName || "Sans nom"}</strong><br/><span style="color:#7a6a5c">${data.email}</span>`)}
        <p style="margin:14px 0 0">Vérifie son profil puis valide-le pour le rendre visible.</p>`,
      cta: { label: "Ouvrir l'administration", href: appUrl("/admin/zuristes") },
    }),
  });
}

/* ====================================================================== */
/*  6. À la CLIENTE — prestation terminée (à confirmer + noter)           */
/* ====================================================================== */
export async function notifyPrestationFinished(
  to: string,
  data: { coiffeuseName: string }
) {
  await sendEmail({
    to,
    subject: "Ta prestation est terminée",
    text: `${data.coiffeuseName} a marqué ta prestation comme terminée. Confirme-la et laisse un avis : ${appUrl("/dashboard/mes-rdv")}`,
    html: layout({
      title: "Ta prestation est terminée",
      bodyHtml: `<p style="margin:0 0 8px"><strong>${data.coiffeuseName}</strong> vient de marquer ta prestation comme terminée.</p>
        <p style="margin:0">Confirme qu'elle a bien eu lieu et laisse-lui une petite note&nbsp;: ça aide les autres clientes à choisir.</p>`,
      cta: { label: "Confirmer et noter", href: appUrl("/dashboard/mes-rdv") },
    }),
  });
}

/* ====================================================================== */
/*  7. À la ZURISTE — nouvel avis reçu                                     */
/* ====================================================================== */
export async function notifyNewReview(
  to: string,
  data: { rating: number; comment: string | null; profileUrl: string }
) {
  const stars =
    "★".repeat(Math.max(0, Math.min(5, data.rating))) +
    "☆".repeat(5 - Math.max(0, Math.min(5, data.rating)));
  const commentHtml = data.comment
    ? `<br/><span style="color:#7a6a5c">«&nbsp;${data.comment}&nbsp;»</span>`
    : "";
  await sendEmail({
    to,
    subject: "Tu as reçu un nouvel avis",
    text: `Une cliente t'a laissé un avis : ${data.rating}/5. ${data.comment ?? ""}`,
    html: layout({
      title: "Tu as reçu un nouvel avis",
      bodyHtml: `<p style="margin:0 0 8px">Une cliente vient de noter sa prestation&nbsp;:</p>
        ${infoBox(`<span style="color:${OR};font-size:18px;letter-spacing:2px">${stars}</span>${commentHtml}`)}
        <p style="margin:14px 0 0">Les avis renforcent ta réputation et ta visibilité sur Zuri. Bravo&nbsp;!</p>`,
      cta: { label: "Voir mon profil", href: data.profileUrl },
    }),
  });
}

/* ====================================================================== */
/*  8. À la ZURISTE — crédit ajouté (recharge)                            */
/* ====================================================================== */
export async function notifyCreditAdded(
  to: string,
  data: { amount: number; balance: number }
) {
  await sendEmail({
    to,
    subject: "Ton crédit Zuri a été rechargé",
    text: `+${formatZuri(data.amount)} ajoutés. Nouveau solde : ${formatZuri(data.balance)}.`,
    html: layout({
      title: "Ton crédit Zuri a été rechargé",
      bodyHtml: `${infoBox(`<strong>+ ${formatZuri(data.amount)}</strong><br/><span style="color:#7a6a5c">Nouveau solde&nbsp;: ${formatZuri(data.balance)}</span>`)}
        <p style="margin:14px 0 0">Tu peux continuer à confirmer des rendez-vous en toute sérénité.</p>`,
      cta: { label: "Voir mon crédit", href: appUrl("/dashboard/credit") },
    }),
  });
}

/* ====================================================================== */
/*  9. À la ZURISTE — alerte de solde (seuil franchi)                     */
/*     level : "high" (≈2000) | "low" (≈1000) | "empty" (profil en pause) */
/* ====================================================================== */
export async function notifyCreditAlert(
  to: string,
  data: { balance: number; level: "high" | "low" | "empty" }
) {
  const solde = formatZuri(Math.max(0, data.balance));
  let subject: string;
  let title: string;
  let body: string;

  if (data.level === "empty") {
    subject = "Ton crédit Zuri est épuisé";
    title = "Ton crédit Zuri est épuisé";
    body = `<p style="margin:0 0 8px">Ton solde est à zéro&nbsp;: ton profil est <strong>temporairement en pause</strong> et n'apparaît plus dans la recherche.</p>
      <p style="margin:0">Recharge ton crédit pour redevenir visible et continuer à recevoir des clientes.</p>`;
  } else if (data.level === "low") {
    subject = "Ton solde Zuri est bas";
    title = "Ton solde Zuri est bas";
    body = `<p style="margin:0 0 8px">Il te reste <strong>${solde}</strong>.</p>
      <p style="margin:0">Pense à recharger bientôt pour ne pas mettre ton profil en pause.</p>`;
  } else {
    subject = "Pense à recharger ton crédit Zuri";
    title = "Il te reste quelques prestations";
    body = `<p style="margin:0 0 8px">Il te reste <strong>${solde}</strong>.</p>
      <p style="margin:0">Encore quelques confirmations avant de devoir recharger — autant anticiper.</p>`;
  }

  await sendEmail({
    to,
    subject,
    text: `${title}. Solde : ${solde}. Recharge : ${appUrl("/dashboard/credit")}`,
    html: layout({
      title,
      bodyHtml: body,
      cta: { label: "Recharger mon crédit", href: appUrl("/dashboard/credit") },
    }),
  });
}

/* ====================================================================== */
/*  10. À L'UTILISATEUR — mot de passe modifié (sécurité)                  */
/* ====================================================================== */
export async function notifyPasswordChanged(to: string) {
  await sendEmail({
    to,
    subject: "Ton mot de passe a été modifié",
    text: `Ton mot de passe Zuri vient d'être modifié. Si ce n'est pas toi, sécurise ton compte : ${appUrl("/dashboard/securite")}`,
    html: layout({
      title: "Ton mot de passe a été modifié",
      bodyHtml: `<p style="margin:0 0 8px">Ton mot de passe Zuri vient d'être changé avec succès.</p>
        <p style="margin:0">Si tu n'es pas à l'origine de cette modification, change-le immédiatement et préviens-nous.</p>`,
      cta: { label: "Gérer mon compte", href: appUrl("/dashboard/securite") },
      footerNote: "Email de sécurité automatique.",
    }),
  });
}

/* ====================================================================== */
/*  11. À la ZURISTE — compte créé par l'admin (accès prêt)               */
/* ====================================================================== */
export async function notifyZuristeAccountCreated(
  to: string,
  data: { prenom?: string }
) {
  const hello = data.prenom ? `${data.prenom}, ` : "";
  await sendEmail({
    to,
    subject: "Ton accès Zuriste est prêt",
    text: `${hello}ton compte Zuriste a été créé. Connecte-toi sur ${appUrl("/login")} avec ton email et le mot de passe communiqué par l'équipe Zuri, puis complète ton profil.`,
    html: layout({
      title: "Bienvenue sur Zuri",
      bodyHtml: `<p style="margin:0 0 8px">${hello}ton compte Zuriste vient d'être créé par l'équipe Zuri.</p>
        <p style="margin:0 0 8px">Connecte-toi avec ton adresse email et le mot de passe qui t'a été communiqué, puis complète ton profil (prestations, photos, disponibilités) pour commencer à recevoir des clientes.</p>
        <p style="margin:0">Pense à changer ton mot de passe une fois connectée.</p>`,
      cta: { label: "Me connecter", href: appUrl("/login") },
    }),
  });
}

/* ====================================================================== */
/*  12. Formulaire d'aide — vers l'équipe (aide@zuriafrica.app)            */
/* ====================================================================== */
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyHelpRequest(data: {
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  sujet: string;
  message: string;
}) {
  const who = `${data.prenom} ${data.nom}`.trim() || "Visiteur";
  await sendEmail({
    to: "aide@zuriafrica.app",
    replyTo: data.email || undefined,
    subject: `Aide — ${data.sujet}`,
    text: `${who} (${data.email || "—"} · ${data.phone || "—"})\nSujet : ${data.sujet}\n\n${data.message}`,
    html: layout({
      title: "Nouveau message d'aide",
      bodyHtml: `${infoBox(
        `<strong>${esc(who)}</strong><br/><span style="color:#7a6a5c">${esc(
          data.email || "—"
        )} · ${esc(data.phone || "—")}</span>`
      )}
        <p style="margin:12px 0 4px"><strong>Sujet&nbsp;:</strong> ${esc(
          data.sujet
        )}</p>
        <p style="margin:0;white-space:pre-wrap;color:#5a4a3e">${esc(
          data.message
        )}</p>`,
    }),
  });
}
