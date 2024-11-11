import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STC Printing',
    short_name: 'Printing',
    description: 'An app for booking printing documents',
    start_url: '/',
    display: 'standalone',
    background_color: '#6b7280',
    theme_color: '#6b7280',
    icons: [
      {
        src: '/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}