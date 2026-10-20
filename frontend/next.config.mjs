/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
