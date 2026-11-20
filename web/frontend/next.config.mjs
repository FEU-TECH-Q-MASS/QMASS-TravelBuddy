import { fileURLToPath } from "node:url";

const nextConfig = {
  // npm workspaces share the lockfile and dependencies at the repository root.
  turbopack: { root: fileURLToPath(new URL("../../", import.meta.url)) },
  // The Vercel Services deployment serves public images directly and returns 404 for /_next/image.
  images: { unoptimized: process.env.VERCEL === "1" },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
