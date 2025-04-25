export const metadata = {
  title: 'Habit Tracker',
  description: 'Seguimiento de hábitos y rutinas diarias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}