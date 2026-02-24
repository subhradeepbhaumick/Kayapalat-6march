import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  // Remove output: 'export' to enable server-side rendering
  images: {
    domains: [
      "kayapalat.co",             // ✅ allow your own domain
      "images.unsplash.com",
      "source.unsplash.com",
      "plus.unsplash.com",
      "i.pravatar.cc",
      "placehold.co",
    ],
    // Allow serving images from the same domain for uploaded files
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kayapalat.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ✅ Add redirects here
  async redirects() {
    return [
      {
        source: "/about-us",
        destination: "/about",
        permanent: true,
      },

      {
        source: "/blog/false-ceiling-design-for-office",
        destination: "/blogs/false-ceiling-design-for-office",
        permanent: true,
      },
      {
        source: "/how-to-choose-the-perfect-wardrobe.php",
        destination: "/blogs/how-to-choose-the-perfect-wardrobe",
        permanent: true,
      },

      {
        source: "/simple-kitchen-design-ideas.php",
        destination: "/blogs/simple-kitchen-design-ideas",
        permanent: true,
      },
      {
        source: "/blog/space-saving-furniture-designs/",
        destination: "/blogs/space-saving-furniture-designs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;