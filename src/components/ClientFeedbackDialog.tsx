'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitClientFeedback } from '@/app/actions'
import { toast } from 'sonner'

export function ClientFeedbackDialog({
    shareToken,
    projectId,
    updateId,
    versionName,
}: {
    shareToken: string
    projectId: string
    updateId?: string
    versionName?: string
}) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        formData.append('shareToken', shareToken)
        formData.append('projectId', projectId)
        if (updateId) formData.append('updateId', updateId)

        const result = await submitClientFeedback(formData)
        setIsPending(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Your feedback has been sent successfully!')
            setOpen(false)
        }
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="ml-auto inline-flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {updateId ? "Give Feedback" : "General Feedback"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form action={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Send Feedback {versionName ? `on ${versionName}` : ""}</DialogTitle>
                            <DialogDescription>
                                Let the developer know if you need any changes, have found an issue, or if things look good!
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clientName">Your Name</Label>
                                <Input
                                    id="clientName"
                                    name="clientName"
                                    placeholder="What's your name?"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message">Feedback / Request</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="Type your message here..."
                                    className="min-h-[120px]"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Sending...' : 'Send Feedback'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
