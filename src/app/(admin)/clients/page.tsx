import { createClient } from "@/utils/supabase/server"
import { NewClientDialog } from "@/components/NewClientDialog"
import { ClientGrid } from "@/components/ClientGrid"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { Tag } from "@/types"

interface ClientWithCount {
    id: string
    name: string
    email: string
    avatar_url?: string
    created_at?: string
    tags?: Tag[]
    projects: { count: number }[]
}

export default async function ClientsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: clientsData, error } = await supabase
        .from("clients")
        .select(`*, projects(count), tags:client_tags(tag:tags(*))`)
        .order("name")

    const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
        .order("name")

    if (error) throw new Error(error.message)

    const clients = ((clientsData || []).map((c: any) => ({
        ...c,
        tags: (c.tags || []).map((ct: any) => ct.tag).filter(Boolean)
    })) as unknown as ClientWithCount[])
    const allTags = (tagsData as unknown as Tag[] || []).filter((t, i, a) => a.findIndex(x => x.name === t.name) === i)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {clients.length} client{clients.length !== 1 ? "s" : ""} in your network.
                    </p>
                </div>
                <NewClientDialog />
            </div>

            {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground border rounded-md gap-4 bg-card">
                    <div className="bg-muted rounded-full p-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-foreground">No clients yet</p>
                        <p className="text-sm mt-1">Click "Add Client" to add your first client to the network.</p>
                    </div>
                </div>
            ) : (
                <ClientGrid clients={clients} allTags={allTags} />
            )}
        </div>
    )
}
