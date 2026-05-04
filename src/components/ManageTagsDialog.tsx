'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tags, Check } from 'lucide-react'
import { Tag } from '@/types'
import { toast } from 'sonner'

interface ManageTagsDialogProps {
    id: string
    initialTagIds: string[]
    itemName: string
    allTags: Tag[]
    onSave: (id: string, tagIds: string[]) => Promise<{ success?: boolean; error?: string }>
}

export function ManageTagsDialog({ id, initialTagIds, itemName, allTags, onSave }: ManageTagsDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>(initialTagIds || [])
    const [isPending, setIsPending] = useState(false)

    function toggleTag(tagId: string) {
        setSelectedIds(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        )
    }

    async function handleSave() {
        setIsPending(true)
        const result = await onSave(id, selectedIds)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Tags saved!')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (val) setSelectedIds(initialTagIds || [])
        }}>
            <DialogTrigger className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left">
                <Tags className="mr-2 h-4 w-4" />
                <span>Manage Tags</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                    <DialogDescription>
                        Select tags for <strong>{itemName}</strong>. Create new tags in the Tags section.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2 max-h-64 overflow-y-auto">
                    {allTags.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No tags yet. Go to <strong>Tags</strong> in the sidebar to create some.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {allTags.map(tag => {
                                const isSelected = selectedIds.includes(tag.id)
                                return (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm text-left ${isSelected ? 'bg-accent' : 'hover:bg-muted'
                                            }`}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="flex-1">{tag.name}</span>
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isPending || allTags.length === 0}>
                        {isPending ? 'Saving...' : 'Save Tags'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
