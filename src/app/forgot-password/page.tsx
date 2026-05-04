import { recoverPassword } from '@/app/login/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { CooldownButton } from '@/components/CooldownButton'

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const params = await searchParams;
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <KeyRound className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="developer@example.com"
                                required
                            />
                        </div>

                        {params?.message && (
                            <p className="p-3 bg-primary/10 text-primary text-center text-sm rounded-md">
                                {params.message.slice(0, 100)}
                            </p>
                        )}

                        <CooldownButton
                            formAction={recoverPassword}
                            cooldownSeconds={60}
                            className="w-full h-9 px-4 py-2 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mt-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            Send Reset Link
                        </CooldownButton>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
