import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["pdfjs-dist", "@google/genai"],
};

export default nextConfig;
