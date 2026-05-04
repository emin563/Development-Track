import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/ThemeToggle"
import { User, Palette, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { changePasswordSettings } from "@/app/login/actions"

export default async function SettingsPage({
    searchParams
}: {
    searchParams: Promise<{ message: string }>
}) {
    const params = await searchParams;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    return (
        <div className="flex flex-col gap-6 max-w-4xl pb-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            <CardTitle>Appearance</CardTitle>
                        </div>
                        <CardDescription>Customize how the application looks for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">Select your preferred theme or sync with your system.</p>
                        </div>
                        <ThemeToggle />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Account</CardTitle>
                        </div>
                        <CardDescription>Your personal account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Email Address</Label>
                                <p className="text-sm font-medium">{user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">User ID</Label>
                                <p className="text-sm font-medium font-mono">{user.id}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Update your developer credentials.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-4 max-w-md">
                            <div className="space-y-1">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" name="password" type="password" required minLength={6} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="confirm_password">Confirm New Password</Label>
                                <Input id="confirm_password" name="confirm_password" type="password" required minLength={6} />
                            </div>

                            {params?.message && (
                                <p className="p-3 bg-primary/10 text-primary text-sm rounded-md col-span-2">
                                    {params.message.slice(0, 100)}
                                </p>
                            )}

                            <Button type="submit" formAction={changePasswordSettings} className="w-fit mt-2">
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
