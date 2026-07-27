import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Evită detectarea greșită a workspace root când există alte lockfile-uri în $HOME.
  turbopack: { root: __dirname },
  // tesseract.js folosește un worker Node; dacă e bundle-uit, path-ul workerului
  // se strică ("Cannot find module .../worker-script/node"). Îl lăsăm extern.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
