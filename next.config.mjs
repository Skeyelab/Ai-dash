/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  basePath: isGitHubPages ? "/Ai-dash" : "",
  assetPrefix: isGitHubPages ? "/Ai-dash" : undefined,
};

export default nextConfig;
