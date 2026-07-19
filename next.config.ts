import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "griplab-mouse-fit";
const basePath = githubPages && !repositoryName.endsWith(".github.io") ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  output: githubPages ? "export" : "standalone",
  poweredByHeader: false,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: githubPages,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_GITHUB_PAGES: githubPages ? "true" : "false",
  },
};

export default nextConfig;
