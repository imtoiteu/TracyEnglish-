/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The workspace packages ship TypeScript source rather than a build artefact.
  transpilePackages: ['@tracy/ui', '@tracy/localization', '@tracy/curriculum', '@tracy/exercise-engine'],
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      // Article artwork served by VOA's public CDN.
      { protocol: 'https', hostname: 'gdb.voanews.com' },
      { protocol: 'https', hostname: '**.voanews.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};

export default nextConfig;
