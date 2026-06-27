"use server";

import { notifyHelpRequest } from "@/lib/notify";
import type { HelpResult } from "./types";

const SUJETS = [
  "J'ai un souci technique",
  "J'ai un souci avec une Zuriste ou une cliente",
  "Parler à un membre de l'équipe Zuri",
];

export async function sendHelpMessage(
  _prev: HelpResult,
  formData: FormData
): Promise<HelpResult> {
  const prenom = String(formData.get("prenom") || "").trim();
  const nom = String(formData.get("nom") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const sujet = String(formData.get("sujet") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!prenom || !email || !message) {
    return { error: "Prénom, email et message sont obligatoires." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Hmm, cet email ne semble pas valide." };
  }
  const sujetVal = SUJETS.includes(sujet) ? sujet : SUJETS[2];

  const result = await notifyHelpRequest({ prenom, nom, email, phone, sujet: sujetVal, message });
  if (!result.ok) {
    return {
      error:
        "Oups, ton message n'a pas pu être envoyé. Réessaie dans un instant, ou écris-nous directement à aide@zuriafrica.app.",
    };
  }
  return {
    ok: "Merci ! Ton message est bien parti, on revient vers toi très vite.",
  };
}
