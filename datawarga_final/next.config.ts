import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ← Tambahkan baris ini
  },
};

export default nextConfig;