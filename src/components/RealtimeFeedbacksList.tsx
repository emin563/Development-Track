'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ProjectFeedback } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedbackCard } from './FeedbackCard'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface RealtimeFeedbacksListProps {
    initialFeedbacks: (ProjectFeedback & { project_title: string })[]
    projectMap: Record<string, string>
    projectToClientMap?: Record<string, string>
    clients?: { id: string, name: string }[]
}

export function RealtimeFeedbacksList({ initialFeedbacks, projectMap, projectToClientMap, clients }: RealtimeFeedbacksListProps) {
    const [feedbacks, setFeedbacks] = useState(initialFeedbacks)
    const [selectedClient, setSelectedClient] = useState<string>("all")
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
                const newFeedback = payload.payload as ProjectFeedback
                const pTitle = projectMap[newFeedback.project_id] || "Unknown Project"

                setFeedbacks((prev) => {
                    const exists = prev.find(fb => fb.id === newFeedback.id)
                    if (exists) {
                        return prev.map((fb) => (fb.id === newFeedback.id ? { ...fb, ...newFeedback, project_title: pTitle } : fb))
                    } else {
                        return [{ ...newFeedback, project_title: pTitle }, ...prev]
                    }
                })
            })
            .on('broadcast', { event: 'feedback_deleted' }, (payload) => {
                const deletedId = payload.payload.id
                setFeedbacks((prev) => prev.filter(fb => fb.id !== deletedId))
            })
            .subscribe((status) => {
                if (process.env.NODE_ENV === 'development') {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] FeedbacksList channel connected')
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.error('[Realtime] FeedbacksList channel error')
                    }
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectMap])

    const visibleFeedbacks = selectedClient === "all" || !projectToClientMap
        ? feedbacks
        : feedbacks.filter(f => projectToClientMap[f.project_id] === selectedClient)

    const openFeedbacks = visibleFeedbacks.filter(f => f.status === 'Open')
    const resolvedFeedbacks = visibleFeedbacks.filter(f => f.status === 'Resolved')

    return (
        <div className="space-y-4">
            {clients && clients.length > 0 && (
                <div className="flex justify-end p-1">
                    <div className="w-full sm:w-[250px]">
                        <Select value={selectedClient} onValueChange={(val) => setSelectedClient(val || 'all')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by client">
                                    {selectedClient === 'all'
                                        ? 'All Clients'
                                        : clients.find(c => c.id === selectedClient)?.name || 'All Clients'}
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
                </div>
            )}
            <Tabs defaultValue="open" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="open" className="relative">
                        Open
                        {openFeedbacks.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {openFeedbacks.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="space-y-4">
                    {openFeedbacks.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <h3 className="text-lg font-medium text-muted-foreground">No open feedbacks</h3>
                            <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
                        </div>
                    ) : openFeedbacks.map(fb => <FeedbackCard key={fb.id} feedback={fb} isOpen={true} />)}
                </TabsContent>
                <TabsContent value="resolved" className="space-y-4">
                    {resolvedFeedbacks.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <h3 className="text-lg font-medium text-muted-foreground">No resolved feedbacks</h3>
                            <p className="text-sm text-muted-foreground mt-1">Resolved items will appear here.</p>
                        </div>
                    ) : resolvedFeedbacks.map(fb => <FeedbackCard key={fb.id} feedback={fb} isOpen={false} />)}
                </TabsContent>
            </Tabs>
        </div>
    )
}
