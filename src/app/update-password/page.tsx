import { updatePassword } from '@/app/login/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function UpdatePasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const params = await searchParams;
    const supabase = await createClient()

    // They must be authenticated to reach this page securely (Supabase login via recovery link)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login?message=Invalid or expired recovery link.')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <KeyRound className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Create New Password</CardTitle>
                    <CardDescription>
                        Enter your new secure password below to regain access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirm_password">Confirm Password</Label>
                            <Input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                required
                                minLength={6}
                            />
                        </div>

                        {params?.message && (
                            <p className="p-3 bg-primary/10 text-primary text-center text-sm rounded-md">
                                {params.message.slice(0, 100)}
                            </p>
                        )}

                        <button
                            type="submit"
                            formAction={updatePassword}
                            className="w-full h-9 px-4 py-2 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mt-2"
                        >
                            Update Password
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
