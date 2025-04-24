import { NextResponse } from "next/server"
import { getGitHubUserInfo } from "@/lib/github-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Se requiere un nombre de usuario" }, { status: 400 })
  }

  try {
    const userData = await getGitHubUserInfo(username)
    return NextResponse.json(userData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener datos de GitHub" }, { status: 500 })
  }
}
