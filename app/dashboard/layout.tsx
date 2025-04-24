import type React from "react"
import { NetworkStatus } from "@/components/network-status"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <NetworkStatus />
    </>
  )
}
