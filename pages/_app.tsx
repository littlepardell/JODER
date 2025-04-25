import AuthProvider from '@/components/auth-provider'
// ...existing imports...

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
