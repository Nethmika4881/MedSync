/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/admin', destination: '/admin/dashboard', permanent: false },
      { source: '/doctor', destination: '/doctor/dashboard', permanent: false },
      { source: '/patient', destination: '/patient/dashboard', permanent: false },
      { source: '/front-desk', destination: '/front-desk/dashboard', permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: '/app/:path*', destination: '/:path*' }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
};

export default nextConfig;
