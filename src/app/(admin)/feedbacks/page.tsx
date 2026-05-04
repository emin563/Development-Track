import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { MessageSquare, CheckCircle2, Clock, Briefcase, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RealtimeFeedbacksList } from "@/components/RealtimeFeedbacksList"

import { Client, ProjectFeedback } from "@/types"

export default async function FeedbacksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: projectsData } = await supabase.from('projects').select('id, title, client:clients(id, name)')

    type ProjectWithClient = { id: string; title: string; client: Client | null }
    const projects = (projectsData as unknown as ProjectWithClient[]) || []

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]))
    const projectIds = Object.keys(projectMap)

    const projectToClientMap = Object.fromEntries(projects.filter(p => p.client).map(p => [p.id, p.client!.id]))
    const clientsMap = new Map<string, Client>()
    projects.forEach(p => {
        if (p.client) clientsMap.set(p.client.id, p.client)
    })
    const clients = Array.from(clientsMap.values())

    let feedbacksData: any[] = []
    if (projectIds.length > 0) {
        const { data } = await supabase
            .from('project_feedbacks')
            .select('*')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
        feedbacksData = data || []
    }

    const feedbacks = feedbacksData.map(fb => ({ ...fb, project_title: projectMap[fb.project_id] || 'Unknown Project' }))

    return (
        <div className="flex flex-col gap-8 w-full pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Client Feedbacks</h1>
                <p className="text-muted-foreground mt-2">Manage and respond to feedback from your customers across all active projects.</p>
            </div>

            <RealtimeFeedbacksList
                initialFeedbacks={feedbacks}
                projectMap={projectMap}
                projectToClientMap={projectToClientMap}
                clients={clients}
            />
        </div>
    )
}
