/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ibb.co.com', // Sesuai error yang Anda terima
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;