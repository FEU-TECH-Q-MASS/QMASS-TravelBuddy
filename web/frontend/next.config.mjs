import { fileURLToPath } from "node:url";

const nextConfig = {
  // npm workspaces share the lockfile and dependencies at the repository root.
  turbopack: { root: fileURLToPath(new URL("../../", import.meta.url)) },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
