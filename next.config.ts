import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  // @ts-ignore
  turbopack: {
    root: '.'
  }
};

export default nextConfig;
