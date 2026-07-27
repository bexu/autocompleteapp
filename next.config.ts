import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Evită detectarea greșită a workspace root când există alte lockfile-uri în $HOME.
  turbopack: { root: __dirname },
};

export default nextConfig;
