import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Sanitize `next` to prevent open redirect attacks (Finding 2)
    let next = searchParams.get('next') ?? '/'
    if (!next.startsWith('/') || next.startsWith('//')) {
        next = '/'
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                const allowedHost = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '')
                if (allowedHost && forwardedHost === allowedHost) {
                    return NextResponse.redirect(`https://${forwardedHost}${next}`)
                }
                return NextResponse.redirect(`${origin}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error("Auth callback error:", error)
        }
    }

    // Redirect to login with error if token is invalid or expired
    return NextResponse.redirect(`${origin}/login?message=Could not verify auth link`)
}
