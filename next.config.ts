import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'officeparser', 'file-type'],
};

export default nextConfig;
