import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its AFM font-metric files off disk at runtime, relative to
  // its own module directory (not statically analyzable). Bundling it breaks
  // that path, so it has to stay external and resolve from node_modules as-is.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
