import './globals.css'

export const metadata = {
  title: 'BillEase - GST Billing Software',
  description: 'Professional GST-compliant billing and invoicing system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
