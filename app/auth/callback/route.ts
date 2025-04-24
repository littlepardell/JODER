import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // Si hay un error, redirigir con el mensaje de error
  if (error) {
    console.error("OAuth error:", error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
      console.log("Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent(error.message)}`)
      }

      // Check if user has a profile
      if (data.user) {
        console.log("User authenticated:", data.user.email)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError && profileError.code === "PGRST116") {
          // No profile found, create one
          console.log("Creating profile for new user")
          const username = `user_${data.user.id.substring(0, 8)}`
          const displayName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || username

          const { error: insertError } = await supabase.from("profiles").insert({
            id: data.user.id,
            username,
            display_name: displayName,
            avatar_url: data.user.user_metadata?.avatar_url,
            public_profile: false,
            public_habits: false,
            public_cigarette_streak: true,
            public_joint_streak: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("Error creating profile:", insertError)
          }

          // También crear el registro de datos del usuario
          const { error: dataError } = await supabase.from("user_data").insert({
            user_id: data.user.id,
            sync_data: {
              cigaretteData: {
                streak: 0,
              },
              jointData: {
                streak: 0,
              },
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (dataError) {
            console.error("Error creating user data:", dataError)
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error during OAuth callback:", err)
      return NextResponse.redirect(`${requestUrl.origin}?error=Authentication%20failed`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
