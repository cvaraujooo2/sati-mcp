import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilitar eslint no build temporariamente
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Habilitar logs detalhados
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Headers para CORS (necessário para MCP)
  async headers() {
    return [
      {
        source: '/mcp',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Cookie' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
