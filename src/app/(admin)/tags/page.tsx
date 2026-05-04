import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { NewTagDialog } from "@/components/NewTagDialog"
import { DeleteTagButton } from "@/components/DeleteTagButton"
import { Tag } from "lucide-react"

export default async function TagsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Fetch all tags with counts for projects and clients
    const { data: tagsData } = await supabase
        .from('tags')
        .select(`
            *,
            project_tags(count),
            client_tags(count)
        `)
        .order('name')

    const tags = tagsData || []

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tags</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create and manage tags to organize your projects and clients.
                    </p>
                </div>
                <NewTagDialog />
            </div>

            {tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground border rounded-md gap-4 bg-card">
                    <div className="bg-muted rounded-full p-4">
                        <Tag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-foreground">No tags yet</p>
                        <p className="text-sm mt-1">Click "New Tag" to create your first tag.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tags.map((tag: any) => {
                        const projectCount = tag.project_tags?.[0]?.count ?? 0
                        const clientCount = tag.client_tags?.[0]?.count ?? 0
                        return (
                            <div
                                key={tag.id}
                                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                            >
                                <span
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-sm">{tag.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {projectCount} project{projectCount !== 1 ? 's' : ''} · {clientCount} client{clientCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <DeleteTagButton tagId={tag.id} />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
