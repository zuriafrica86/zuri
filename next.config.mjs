import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare Workers n'utilise pas l'optimiseur d'images de Vercel.
    // Les photos sont compressées à l'upload côté Supabase (Bloc 2).
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;

// Intègre l'adaptateur Cloudflare au serveur de dev Next (no-op en production).
initOpenNextCloudflareForDev();
