import Image from "next/image";
import Link from "next/link";

export function Logo({
  variant = "wordmark",
}: {
  variant?: "wordmark" | "icon" | "light";
}) {
  const src =
    variant === "icon"
      ? "/icone-zuri.png"
      : variant === "light"
        ? "/logo-zuri-light.png"
        : "/logo-zuri.png";
  const w = variant === "icon" ? 44 : 128;
  const h = variant === "icon" ? 44 : 50;
  return (
    <Link href="/" aria-label="ZURI — accueil" className="inline-flex">
      <Image src={src} alt="ZURI" width={w} height={h} priority />
    </Link>
  );
}
