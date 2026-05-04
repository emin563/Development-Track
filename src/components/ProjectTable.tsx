'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Project, Client, Tag } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectActions } from "@/components/ProjectActions"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProjectTable({ projects, clients, allTags }: { projects: Project[], clients?: Client[], allTags?: Tag[] }) {
  const [selectedClientId, setSelectedClientId] = useState<string>("all")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  function toggleTag(tagId: string) {
    setSelectedTagIds(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId])
  }

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>
      case 'Pending':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pending</Badge>
      case 'Completed':
        return <Badge variant="outline" className="text-slate-500">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchClient = selectedClientId === "all" || p.client_id === selectedClientId
      const matchTags = selectedTagIds.length === 0 || selectedTagIds.every(id => p.tags?.some(t => t.id === id))
      return matchClient && matchTags
    })
  }, [projects, selectedClientId, selectedTagIds])

  return (
    <div className="space-y-3">
      {(clients || (allTags && allTags.length > 0)) && (
        <div className="flex flex-col gap-3 p-1">
          {clients && (
            <div className="w-full sm:w-[250px]">
              <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val || 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by client">
                    {selectedClientId === 'all'
                      ? 'All Clients'
                      : clients.find(c => c.id === selectedClientId)?.name || 'All Clients'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {allTags && allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => {
                const isActive = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isActive ? 'border-transparent text-white' : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      }`}
                    style={isActive ? { backgroundColor: tag.color } : {}}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : tag.color }} />
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Project Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1 items-start">
                      <Link href={`/projects/${project.id}`} className="text-primary hover:underline">
                        {project.title}
                      </Link>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {project.tags.map(t => (
                            <span
                              key={t.id}
                              className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                              style={{ backgroundColor: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.client ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={project.client.avatar_url || ''} alt={project.client.name} />
                          <AvatarFallback>{project.client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{project.client.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell className="text-right">
                    {new Date(project.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <ProjectActions project={project} allTags={allTags || []} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
