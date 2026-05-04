'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ProjectFeedback } from '@/types'
import { format } from "date-fns"
import { Clock, CheckCircle2, MessageSquare } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RealtimeClientFeedbacksProps {
    initialFeedbacks: ProjectFeedback[]
    projectMap: Record<string, string>
    activeProjectId: string
}

export function RealtimeClientFeedbacks({ initialFeedbacks, projectMap, activeProjectId }: RealtimeClientFeedbacksProps) {
    const [feedbacks, setFeedbacks] = useState(initialFeedbacks)
    const supabaseRef = useRef(createClient())

    useEffect(() => {
        setFeedbacks(initialFeedbacks)
    }, [initialFeedbacks])

    useEffect(() => {
        const supabase = supabaseRef.current
        const channel = supabase
            .channel('public-feedbacks', {
                config: { broadcast: { self: true } }
            })
            .on('broadcast', { event: 'feedback_changed' }, (payload) => {
                const updatedFeedback = payload.payload as ProjectFeedback
                if (projectMap[updatedFeedback.project_id]) {
                    setFeedbacks((prev) => {
                        const exists = prev.find(fb => fb.id === updatedFeedback.id)
                        if (exists) {
                            return prev.map((fb) => (fb.id === updatedFeedback.id ? { ...fb, ...updatedFeedback } : fb))
                        } else {
                            return [updatedFeedback, ...prev]
                        }
                    })
                }
            })
            .on('broadcast', { event: 'feedback_deleted' }, (payload) => {
                const deletedId = payload.payload.id
                setFeedbacks((prev) => prev.filter(fb => fb.id !== deletedId))
            })
            .subscribe((status) => {
                if (process.env.NODE_ENV === 'development') {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] ClientFeedbacks channel connected')
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.error('[Realtime] ClientFeedbacks channel error')
                    }
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectMap])

    const visibleFeedbacks = feedbacks.filter((fb) => fb.project_id === activeProjectId)

    if (visibleFeedbacks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-xl">
                <MessageSquare className="w-8 h-8 opacity-20 mb-4" />
                <p className="text-lg font-medium">No feedback sent yet</p>
                <p className="text-sm mt-1">Feedback related to this specific project will appear here.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {visibleFeedbacks.map((fb) => (
                <Card key={fb.id} className="shadow-none">
                    <CardHeader className="py-4 bg-muted/10 border-b">
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                            <div>
                                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">{fb.client_name}</span>
                                    <span className="text-muted-foreground font-normal text-sm mx-1">on</span>
                                    <Badge variant="outline" className="font-normal bg-background">
                                        {projectMap[fb.project_id] || "Project"}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="mt-1.5 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(fb.created_at), "MMM d, yyyy - h:mm a")}
                                </CardDescription>
                            </div>
                            <Badge variant={fb.status === 'Resolved' ? 'secondary' : 'default'} className={fb.status === 'Resolved' ? 'bg-green-500/10 text-green-700' : ''}>
                                {fb.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="py-4 space-y-4">
                        <div className="text-sm text-foreground/90 whitespace-pre-wrap">{fb.message}</div>
                        {fb.developer_response && (
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Developer Response
                                </h4>
                                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{fb.developer_response}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
