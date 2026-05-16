import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ["@teamsster/auth", "@teamsster/db"],
};

export default nextConfig;
