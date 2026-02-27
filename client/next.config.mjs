/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Allow dev server to be accessible from Docker
  allowedDevOrigins: ['http://localhost:3000'],
};

export default nextConfig;
