'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createTag } from '@/app/actions'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

export function NewTagDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [color, setColor] = useState('#6366f1')

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        formData.set('color', color)
        const result = await createTag(formData)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Tag created!')
            setOpen(false)
            setColor('#6366f1')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />
                New Tag
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Create New Tag</DialogTitle>
                    <DialogDescription>
                        Give this tag a name and a color. You can then assign it to any project or client.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tag Name</Label>
                            <Input id="name" name="name" placeholder="e.g. Frontend, Urgent, VIP Client" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className="w-7 h-7 rounded-full border-2 transition-all"
                                        style={{
                                            backgroundColor: c,
                                            borderColor: color === c ? 'white' : 'transparent',
                                            outline: color === c ? `2px solid ${c}` : 'none',
                                            outlineOffset: '2px'
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }} />
                                <Input
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    className="w-32 font-mono text-xs h-7"
                                    placeholder="#6366f1"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Tag'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
