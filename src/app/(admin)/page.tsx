import { ProjectTable } from "@/components/ProjectTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewProjectDialog } from "@/components/NewProjectDialog"
import { NewClientDialog } from "@/components/NewClientDialog"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Project, Client, Tag } from "@/types"

export default async function Home() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`*, client:clients(*), tags:project_tags(tag:tags(*))`)
        .order('created_at', { ascending: false })

    const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name')

    const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .order('name')

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    <h2 className="font-bold">Error connecting to database:</h2>
                    <pre className="mt-2 text-sm">{JSON.stringify(error, null, 2)}</pre>
                </div>
            </div>
        )
    }

    const projects = ((projectsData || []).map((p: any) => ({
        ...p,
        tags: (p.tags || []).map((pt: any) => pt.tag).filter(Boolean)
    })) as unknown as Project[])
    const clients = (clientsData as unknown as Client[]) || []
    const allTags = (tagsData as unknown as Tag[]) || []

    const activeProjectsCount = projects.filter(p => p.status === 'Active').length
    const completedProjectsCount = projects.filter(p => p.status === 'Completed').length
    const pendingProjectsCount = projects.filter(p => p.status === 'Pending').length

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeProjectsCount}</div>
                        <p className="text-xs text-muted-foreground">Projects currently in progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingProjectsCount}</div>
                        <p className="text-xs text-muted-foreground">Awaiting kickoff or client feedback</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedProjectsCount}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Recent Projects</h2>
                    <div className="flex gap-2">
                        <NewClientDialog />
                        <NewProjectDialog clients={clients} />
                    </div>
                </div>
                <ProjectTable projects={projects} clients={clients} allTags={allTags} />
            </div>
        </div>
    )
}
