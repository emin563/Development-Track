import { createClient } from "@/utils/supabase/server"
import { Project, ProjectStatus, Tag } from "@/types"
import { ProjectTable } from "@/components/ProjectTable"
import { NewProjectDialog } from "@/components/NewProjectDialog"
import { redirect } from "next/navigation"
import Link from "next/link"

const STATUS_TABS: { label: string; value: ProjectStatus | "All" }[] = [
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Pending", value: "Pending" },
    { label: "Completed", value: "Completed" },
]

export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { status } = await searchParams
    const activeFilter = STATUS_TABS.find(t => t.value === status)?.value ?? "All"

    const [
        { data: projectsData, error },
        { data: clientsData },
        { data: tagsData }
    ] = await Promise.all([
        supabase
            .from("projects")
            .select(`*, client:clients(*), tags:project_tags(tag:tags(*))`)
            .order("created_at", { ascending: false }),
        supabase
            .from("clients")
            .select("*")
            .order("name"),
        supabase
            .from("tags")
            .select("*")
            .order("name")
    ])

    if (error) throw new Error(error.message)

    // Flatten the joined tags from [{tag: {...}}] to Tag[]
    const allProjects = ((projectsData || []).map((p: any) => ({
        ...p,
        tags: (p.tags || []).map((pt: any) => pt.tag).filter(Boolean)
    })) as unknown as Project[])

    const clients = clientsData || []
    const allTags = (tagsData as unknown as Tag[] || []).filter((t, i, a) => a.findIndex(x => x.name === t.name) === i)

    const counts = {
        All: allProjects.length,
        Active: allProjects.filter(p => p.status === "Active").length,
        Pending: allProjects.filter(p => p.status === "Pending").length,
        Completed: allProjects.filter(p => p.status === "Completed").length,
    }

    const filteredProjects =
        activeFilter === "All"
            ? allProjects
            : allProjects.filter(p => p.status === activeFilter)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                    <p className="text-sm text-muted-foreground mt-1">All your projects in one place.</p>
                </div>
                <NewProjectDialog clients={clients} />
            </div>

            <div className="flex gap-1 border-b border-border">
                {STATUS_TABS.map(tab => {
                    const isActive = activeFilter === tab.value
                    const href = tab.value === "All" ? "/projects" : `/projects?status=${tab.value}`
                    return (
                        <Link
                            key={tab.value}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px] ${isActive
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                        >
                            {tab.label}
                            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                {counts[tab.value]}
                            </span>
                        </Link>
                    )
                })}
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-md">
                    <p className="text-lg font-medium">No projects found</p>
                    <p className="text-sm mt-1">
                        {activeFilter === "All" ? 'Click "Add Project" to create your first project.' : `No ${activeFilter.toLowerCase()} projects yet.`}
                    </p>
                </div>
            ) : (
                <ProjectTable projects={filteredProjects} clients={clients} allTags={allTags} />
            )}
        </div>
    )
}
