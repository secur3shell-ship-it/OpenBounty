import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root has its own yarn.lock (the on-chain side), so pin the app
  // root to this folder instead of letting Next.js guess.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
