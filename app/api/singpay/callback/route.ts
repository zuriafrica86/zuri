import { confirmRecharge } from "@/lib/recharge-confirm";

export const dynamic = "force-dynamic";

// Webhook optionnel : si tu configures une URL de notification dans ton
// Workspace SingPay, elle tombe ici. On extrait la référence, on confirme
// (vérification + crédit idempotent). Sans configuration, cette route ne sert
// pas — la confirmation se fait au retour (/api/singpay/return).
async function extractReference(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const q =
    url.searchParams.get("reference") ||
    url.searchParams.get("ref") ||
    url.searchParams.get("external_reference");
  if (q) return q;
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const b = (await req.json()) as Record<string, unknown>;
      const data = b.data as Record<string, unknown> | undefined;
      return (
        (b.reference as string) ||
        (b.ref as string) ||
        (b.external_reference as string) ||
        (data?.reference as string) ||
        null
      );
    }
    const f = await req.formData();
    return (
      f.get("reference")?.toString() ||
      f.get("ref")?.toString() ||
      f.get("external_reference")?.toString() ||
      null
    );
  } catch {
    return null;
  }
}

async function handle(req: Request): Promise<Response> {
  const reference = await extractReference(req);
  if (reference) await confirmRecharge(reference);
  return new Response("ok", { status: 200 });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
