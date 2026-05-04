'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ProjectUpdate } from '@/types'
import { format } from "date-fns"
import { Clock, ExternalLink } from "lucide-react"
import { ClientFeedbackDialog } from "@/components/ClientFeedbackDialog"

interface RealtimeClientUpdatesProps {
    initialUpdates: ProjectUpdate[]
    projectId: string
    shareToken: string
}

export function RealtimeClientUpdates({ initialUpdates, projectId, shareToken }: RealtimeClientUpdatesProps) {
    const [updates, setUpdates] = useState(initialUpdates)
    const supabaseRef = useRef(createClient())

    useEffect(() => {
        setUpdates(initialUpdates)
    }, [initialUpdates])

    useEffect(() => {
        const supabase = supabaseRef.current
        const channel = supabase
            .channel('public-updates', {
                config: { broadcast: { self: true } }
            })
            .on('broadcast', { event: 'update_added' }, (payload) => {
                const newUpdate = payload.payload as ProjectUpdate
                if (newUpdate.project_id === projectId) {
                    setUpdates((prev) => [newUpdate, ...prev])
                }
            })
            .on('broadcast', { event: 'update_deleted' }, (payload) => {
                const deletedId = payload.payload.id
                setUpdates((prev) => prev.filter(up => up.id !== deletedId))
            })
            .subscribe((status) => {
                if (process.env.NODE_ENV === 'development') {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] ClientUpdates channel connected')
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.error('[Realtime] ClientUpdates channel error')
                    }
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId])

    if (updates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-xl">
                <Clock className="w-8 h-8 opacity-20 mb-4" />
                <p className="text-lg font-medium">No updates yet</p>
                <p className="text-sm mt-1">Check back later for progress and new versions.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {updates.map((update) => (
                <div key={update.id} className="p-6 rounded-xl border shadow-sm transition-all hover:border-primary/30">
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-md font-bold text-sm bg-primary/10 text-primary">
                                    {update.version}
                                </span>
                                <time className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {format(new Date(update.created_at), "MMMM d, yyyy")}
                                </time>
                            </div>
                        </div>

                        {update.description && (
                            <div className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {update.description}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
                            {update.resource_url ? (
                                <a
                                    href={update.resource_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Demo / Resource
                                </a>
                            ) : <div />}

                            <ClientFeedbackDialog
                                shareToken={shareToken}
                                projectId={projectId}
                                updateId={update.id}
                                versionName={update.version}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
