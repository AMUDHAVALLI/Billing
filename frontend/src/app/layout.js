import './globals.css'
import RegisterSW from '@/components/RegisterSW'

export const metadata = {
  title: 'BillEase - GST Billing Software',
  description: 'Professional GST-compliant billing and invoicing system',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BillEase',
  },
}

export const viewport = {
  themeColor: '#0284c7',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}
