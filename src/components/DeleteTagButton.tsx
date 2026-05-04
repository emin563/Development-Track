'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteTag } from '@/app/actions'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function DeleteTagButton({ tagId }: { tagId: string }) {
    const [isPending, setIsPending] = useState(false)

    async function handleDelete() {
        if (!confirm('Delete this tag? It will be removed from all projects and clients.')) return
        setIsPending(true)
        const result = await deleteTag(tagId)
        setIsPending(false)
        if (result?.error) toast.error(result.error)
        else toast.success('Tag deleted')
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
    )
}
