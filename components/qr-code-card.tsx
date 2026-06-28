"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

const IVOIRE = "#F7F0E6";
const CACAO = "#2A1A12";
const OR = "#E2B0A0";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Compose la carte (carrés logiques 720x900, rendue x2 pour la netteté).
async function buildCard(
  url: string,
  name: string,
  slug: string
): Promise<string> {
  const W = 720;
  const H = 900;
  const S = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.scale(S, S);

  // Fond ivoire + cadre or arrondi
  ctx.fillStyle = IVOIRE;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 20, 20, W - 40, H - 40, 28);
  ctx.strokeStyle = OR;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Logo (wordmark)
  try {
    const logo = await loadImage("/logo-zuri.png");
    const lw = 300;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 70, lw, lh);
  } catch {
    // logo indisponible : on continue sans
  }

  ctx.textAlign = "center";

  // Label "ZURISTE" (espacé à la main, sans dépendre de letterSpacing)
  ctx.fillStyle = OR;
  ctx.font =
    "600 22px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Z U R I S T E", W / 2, 236);

  // Nom public (serif, réduit si trop long)
  ctx.fillStyle = CACAO;
  let fs = 44;
  ctx.font = `700 ${fs}px Georgia, 'Times New Roman', serif`;
  while (ctx.measureText(name).width > W - 120 && fs > 24) {
    fs -= 2;
    ctx.font = `700 ${fs}px Georgia, 'Times New Roman', serif`;
  }
  ctx.fillText(name, W / 2, 292);

  // QR code (cacao sur ivoire, pour se fondre dans la carte)
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: 380 * S,
    margin: 1,
    color: { dark: CACAO, light: IVOIRE },
  });
  const q = 360;
  ctx.drawImage(qrCanvas, (W - q) / 2, 330, q, q);

  // "Scannez pour réserver"
  ctx.fillStyle = CACAO;
  ctx.font =
    "600 28px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Scannez pour réserver", W / 2, 742);

  // URL discrète
  ctx.fillStyle = "rgba(42,26,18,0.45)";
  ctx.font = "18px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`zuriafrica.app/zuriste/${slug}`, W / 2, 780);

  return canvas.toDataURL("image/png");
}

export function QrCodeCard({ slug, name }: { slug: string; name: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [building, setBuilding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fullUrl = `${window.location.origin}/zuriste/${slug}`;
        const png = await buildCard(fullUrl, name || "Ma page Zuri", slug);
        if (!cancelled) setDataUrl(png);
      } catch {
        // génération impossible
      } finally {
        if (!cancelled) setBuilding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, name]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-zuri-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="rounded-xl2 border border-sable bg-white p-5 shadow-soft">
      <p className="text-sm text-cacao/60">Mon QR code</p>
      <p className="mt-1 text-sm text-cacao/70">
        À imprimer ou partager : tes clientes le scannent et réservent en un
        instant.
      </p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="w-44 shrink-0 overflow-hidden rounded-xl2 border border-sable">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Aperçu de mon QR code Zuri"
              className="w-full"
            />
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-cacao/40">
              {building ? "Génération…" : "Indisponible"}
            </div>
          )}
        </div>
        <button
          onClick={download}
          disabled={!dataUrl}
          className="inline-flex items-center gap-2 rounded-xl2 bg-or px-5 py-3 font-medium text-cacao transition hover:bg-or-clair disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden /> Télécharger mon QR code
        </button>
      </div>
    </div>
  );
}
