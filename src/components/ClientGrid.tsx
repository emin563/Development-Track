'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Users } from "lucide-react"
import { ClientActions } from "@/components/ClientActions"
import { Badge } from "@/components/ui/badge"
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

export function ClientGrid({ clients, allTags }: { clients: ClientWithCount[], allTags: Tag[] }) {
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

    function toggleTag(tagId: string) {
        setSelectedTagIds(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId])
    }

    const filteredClients = useMemo(() => {
        if (selectedTagIds.length === 0) return clients
        return clients.filter(c =>
            selectedTagIds.every(id => c.tags?.some(t => t.id === id))
        )
    }, [clients, selectedTagIds])

    return (
        <div className="space-y-4">
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-1">
                    {allTags.map(tag => {
                        const isActive = selectedTagIds.includes(tag.id)
                        return (
                            <button
                                key={tag.id}
                                onClick={() => toggleTag(tag.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isActive
                                        ? 'border-transparent text-white'
                                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
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

            {filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground border rounded-md gap-4 bg-card">
                    <div className="bg-muted rounded-full p-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-foreground">No clients found</p>
                        <p className="text-sm mt-1">
                            {clients.length === 0 ? 'Click "Add Client" to add your first client.' : 'No clients match your tag filters.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredClients.map((client) => {
                        const projectCount = client.projects?.[0]?.count ?? 0
                        const initials = client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                        return (
                            <Card key={client.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        {client.avatar_url ? (
                                            <img src={client.avatar_url} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                                                {initials}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{client.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                                        </div>
                                        <ClientActions client={client} allTags={allTags} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Projects</span>
                                        <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${projectCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                            {projectCount}
                                        </span>
                                    </div>
                                    {client.tags && client.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {client.tags.map(t => (
                                                <span
                                                    key={t.id}
                                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                                    style={{ backgroundColor: t.color }}
                                                >
                                                    {t.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
