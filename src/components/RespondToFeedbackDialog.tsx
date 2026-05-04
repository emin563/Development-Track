'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { respondToFeedback } from '@/app/actions'
import { Reply, CheckCircle2 } from 'lucide-react'

export function RespondToFeedbackDialog({
    feedbackId,
    projectId
}: {
    feedbackId: string
    projectId?: string
}) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function clientAction(formData: FormData) {
        setIsPending(true)
        try {
            await respondToFeedback(formData)
            setOpen(false)
            router.refresh()  // Re-sync server state so admin sees response immediately
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 font-medium" />}>
                <Reply className="w-4 h-4 mr-2" />
                Respond
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Respond to Client</DialogTitle>
                    <DialogDescription>
                        Write a response to the client's feedback. The client will see your response in their portal.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <input type="hidden" name="feedbackId" value={feedbackId} />
                    {projectId && <input type="hidden" name="projectId" value={projectId} />}
                    <div className="grid gap-2">
                        <Textarea
                            id="response"
                            name="response"
                            placeholder="Type your reply here..."
                            className="resize-none"
                            rows={4}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Sending..." : "Send Response"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
