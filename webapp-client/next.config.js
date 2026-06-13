/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le variabili NEXT_PUBLIC_* (DEMO, API_URL) sono iniettate automaticamente da Next.
  // Reti di sicurezza per il deploy demo: build resiliente anche con warning TS/ESLint.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
module.exports = nextConfig;
