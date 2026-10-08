/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produit un serveur Node autonome (.next/standalone) idéal pour Railway.
  output: "standalone",
};

module.exports = nextConfig;
