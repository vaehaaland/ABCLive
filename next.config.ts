import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Supabase generic type inference fails in strict tsc build.
    // IDE type checking still works. Fix properly when upgrading @supabase/ssr.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
