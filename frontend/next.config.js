/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { serverComponentsExternalPackages: ["bcryptjs", "node-telegram-bot-api"] },
};
module.exports = nextConfig;
