'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { addProjectUpdate } from '@/app/actions'
import { toast } from 'sonner'

export function NewUpdateDialog({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        formData.append('project_id', projectId)
        const result = await addProjectUpdate(formData)
        setIsPending(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Update posted successfully')
            setOpen(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post Update
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form action={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Post a Project Update</DialogTitle>
                            <DialogDescription>
                                Share progress, new versions, or build links with your client.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="version">Version / Title</Label>
                                <Input
                                    id="version"
                                    name="version"
                                    placeholder="e.g. v1.2 Release or UI Design Complete"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="What changes were made? What should the client look at?"
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="resource_url">Link / Resource URL (Optional)</Label>
                                <Input
                                    id="resource_url"
                                    name="resource_url"
                                    placeholder="https://expo.dev/..."
                                    type="url"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Posting...' : 'Post Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
