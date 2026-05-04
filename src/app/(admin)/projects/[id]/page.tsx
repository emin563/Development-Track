import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Project, ProjectUpdate, ProjectFeedback } from "@/types"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, ExternalLinkIcon, ArrowLeft, CheckCircle2, Trash2 } from "lucide-react"
import Link from "next/link"
import { NewUpdateDialog } from "@/components/NewUpdateDialog"
import { resolveClientFeedback, reopenClientFeedback, deleteProjectUpdate, deleteClientFeedback, regenerateShareToken } from "@/app/actions"
import { CopyLinkButton } from "@/components/CopyLinkButton"
import { RespondToFeedbackDialog } from "@/components/RespondToFeedbackDialog"
import { RealtimeFeedbacksList } from "@/components/RealtimeFeedbacksList"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"

export default async function AdminProjectDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: projectData, error } = await supabase
        .from("projects")
        .select(`*, client:clients(*)`)
        .eq("id", id)
        .single()

    if (error || !projectData) notFound()

    const project = projectData as Project

    const { data: updatesData } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false })

    const updates = (updatesData as unknown as ProjectUpdate[]) || []

    const { data: feedbacksData } = await supabase
        .from("project_feedbacks")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false })

    const feedbacks = ((feedbacksData as unknown as ProjectFeedback[]) || []).map(fb => ({
        ...fb,
        project_title: project.title
    }))

    return (
        <div className="flex flex-col gap-6 w-full pb-20">
            <div className="flex items-center gap-4">
                <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{project.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Client: <span className="font-medium text-foreground">{project.client?.name || "Unassigned"}</span>
                    </p>
                </div>
            </div>

            {project.share_token && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg flex items-center justify-between">
                            Client Portal
                            <a href={`/client/projects/${project.share_token}`} target="_blank" rel="noreferrer" className="text-sm font-normal flex items-center gap-2 text-primary hover:underline">
                                View Portal <ExternalLinkIcon className="w-4 h-4" />
                            </a>
                        </CardTitle>
                        <CardDescription className="flex items-center justify-between gap-4 flex-wrap mt-1">
                            <span>Share this secret link with your client so they can track progress without logging in.</span>
                            <div className="flex items-center gap-2">
                                <CopyLinkButton shareToken={project.share_token} />
                                <form action={async () => {
                                    'use server'
                                    await regenerateShareToken(id)
                                }}>
                                    <Button variant="destructive" size="sm" type="submit">Regenerate Link</Button>
                                </form>
                            </div>
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <Tabs defaultValue="updates" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="updates">Updates & Releases</TabsTrigger>
                    <TabsTrigger value="feedbacks">
                        Client Feedbacks
                        {feedbacks.filter(f => f.status === 'Open').length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {feedbacks.filter(f => f.status === 'Open').length} New
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="updates" className="space-y-4">
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
                        <div>
                            <h3 className="font-semibold text-lg">Project Updates</h3>
                            <p className="text-sm text-muted-foreground">Post new versions, design updates, or EAS build links.</p>
                        </div>
                        <NewUpdateDialog projectId={id} />
                    </div>

                    <div className="grid gap-4 mt-6">
                        {updates.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No updates posted yet.</p>
                        ) : (
                            updates.map(update => (
                                <Card key={update.id}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <Badge>{update.version}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(update.created_at), "MMM d, yyyy h:mm a")}
                                                </span>
                                            </div>
                                            <DeleteConfirmDialog
                                                action={deleteProjectUpdate}
                                                hiddenFields={{ updateId: update.id, projectId: id }}
                                                itemName={`Update ${update.version}`}
                                            />
                                        </div>
                                        {update.description && (
                                            <p className="text-sm mt-2 whitespace-pre-wrap">{update.description}</p>
                                        )}
                                        {update.resource_url && (
                                            <a href={update.resource_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                                                <ExternalLink className="w-4 h-4" />
                                                Access Resource
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="feedbacks">
                    <div className="grid gap-4 mt-4">
                        <RealtimeFeedbacksList
                            initialFeedbacks={feedbacks}
                            projectMap={{ [id]: project.title }}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
