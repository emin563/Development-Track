import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Project, ProjectUpdate, ProjectFeedback } from "@/types"
import { format } from "date-fns"
import { Clock, CheckCircle2, ArrowRightCircle, ExternalLink, MessageSquare, Briefcase, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientFeedbackDialog } from "@/components/ClientFeedbackDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ThemeToggle } from "@/components/ThemeToggle"
import { RealtimeClientUpdates } from "@/components/RealtimeClientUpdates"
import { RealtimeClientFeedbacks } from "@/components/RealtimeClientFeedbacks"

export default async function ClientProjectViewPage({
    params,
    searchParams
}: {
    params: Promise<{ shareToken: string }>,
    searchParams: Promise<{ p?: string }>
}) {
    const { shareToken } = await params
    const { p: activeProjectId } = await searchParams

    const supabase = await createClient()

    // Fetch all client projects, updates, and feedbacks concurrently
    const [
        { data: projectsData, error: projError },
        { data: updatesData },
        { data: feedbackData }
    ] = await Promise.all([
        supabase.rpc("get_client_projects_by_share_token", { token: shareToken }),
        supabase.rpc('get_project_updates_by_share_token', { p_share_token: shareToken }),
        supabase.rpc("get_client_all_feedbacks_by_share_token", { token: shareToken })
    ])

    if (projError || !projectsData || projectsData.length === 0) {
        notFound()
    }

    const allProjects = projectsData as Project[]

    // The token inherently belongs to one specific project originally
    const mainProject = allProjects.find(p => p.share_token === shareToken) || allProjects[0]

    // Determine which project is currently selected in the UI
    const activeProject = activeProjectId
        ? allProjects.find(p => p.id === activeProjectId) || mainProject
        : mainProject

    // Updates are filtered in memory (DB pagination pushes would improve this further)
    const updates = ((updatesData as unknown as ProjectUpdate[]) || []).filter(u => u.project_id === activeProject.id)

    const feedbacks = (feedbackData as unknown as ProjectFeedback[]) || []

    // Status visual mapping
    const statusConfig = {
        Active: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
        Pending: { icon: ArrowRightCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
        Completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    }

    const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.title]))

    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            <main className="w-full max-w-5xl px-6 py-12 flex flex-col gap-10">

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-border w-full">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Client Portal</h1>
                        <p className="text-muted-foreground">Track your ongoing projects and feedback</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header>

                <Tabs defaultValue="projects" className="w-full">
                    <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="projects">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Current Projects
                        </TabsTrigger>
                        <TabsTrigger value="feedbacks">
                            <FileText className="w-4 h-4 mr-2" />
                            Feedback History
                        </TabsTrigger>
                    </TabsList>

                    {/* CURRENT PROJECTS TAB */}
                    <TabsContent value="projects" className="space-y-8 mt-0">
                        {/* Project Selector / List */}
                        {allProjects.length > 1 && (
                            <div className="flex flex-wrap gap-2 pb-4">
                                {allProjects.map((proj) => (
                                    <Link key={proj.id} href={`/client/projects/${shareToken}?p=${proj.id}`}>
                                        <Badge
                                            variant={proj.id === activeProject.id ? "default" : "secondary"}
                                            className="px-4 py-1.5 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            {proj.title}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Active Project View */}
                        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 border-b">
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold">{activeProject.title}</h2>
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium ${statusConfig[activeProject.status]?.bg || 'bg-gray-100'} ${statusConfig[activeProject.status]?.color || 'text-gray-600'}`}>
                                            {(() => {
                                                const Icon = statusConfig[activeProject.status]?.icon || Clock
                                                return <Icon className="w-4 h-4" />
                                            })()}
                                            {activeProject.status}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Due Date: {activeProject.due_date ? format(new Date(activeProject.due_date), "MMM d, yyyy") : "N/A"}
                                        </span>
                                    </div>
                                </div>
                                <ClientFeedbackDialog shareToken={shareToken} projectId={activeProject.id} />
                            </div>

                            <div className="p-6 md:p-8">
                                <h3 className="text-xl font-bold mb-6">Demo & Updates</h3>

                                <RealtimeClientUpdates
                                    initialUpdates={updates}
                                    projectId={activeProject.id}
                                    shareToken={shareToken}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* FEEDBACK HISTORY TAB */}
                    <TabsContent value="feedbacks" className="mt-0">
                        <div className="border rounded-xl bg-card shadow-sm p-6 md:p-8">
                            <h2 className="text-2xl font-bold mb-2">Feedback History</h2>
                            <p className="text-muted-foreground mb-8">View all the requests and feedbacks you have submitted across your projects.</p>

                            <RealtimeClientFeedbacks
                                initialFeedbacks={feedbacks}
                                projectMap={projectMap}
                                activeProjectId={activeProject.id}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

            </main>
        </div>
    )
}
