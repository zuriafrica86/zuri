import { NextResponse } from "next/server";
import { confirmRecharge } from "@/lib/recharge-confirm";

export const dynamic = "force-dynamic";

function base(): string {
  return process.env.APP_URL || "https://zuriafrica.app";
}

// SingPay renvoie la Zuriste ici (redirect_success) avec ?ref=...
// On confirme le paiement côté serveur, puis on l'envoie vers sa page Crédit.
async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ref =
    url.searchParams.get("ref") || url.searchParams.get("reference") || "";

  let status: string = "retour";
  if (ref) {
    const result = await confirmRecharge(ref);
    if (result === "paid") status = "succes";
    else if (result === "failed") status = "echec";
    else status = "attente";
  }

  return NextResponse.redirect(
    `${base()}/dashboard/credit?recharge=${status}`,
    303
  );
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
