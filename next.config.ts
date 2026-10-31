/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wneonnqavtbwziybbxaq.supabase.co",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:all*(webp|jpg|jpeg|png|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;