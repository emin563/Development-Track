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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
    action: (formData: FormData) => void;
    hiddenFields: Record<string, string>;
    itemName: string;
}

export function DeleteConfirmDialog({ action, hiddenFields, itemName }: DeleteConfirmDialogProps) {
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [isPending, setIsPending] = useState(false)

    const isConfirmed = confirmText.trim().toLowerCase() === 'delete'

    async function handleAction(formData: FormData) {
        setIsPending(true)
        try {
            await action(formData)
            setOpen(false)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) setConfirmText('')
        }}>
            <DialogTrigger className="inline-flex ml-2 h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" title="Delete">
                <Trash2 className="w-4 h-4" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-destructive">Are you sure?</DialogTitle>
                    <DialogDescription>
                        This will permanently delete {itemName}. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleAction} className="grid gap-4 py-4">
                    {/* Render hidden fields natively so the server action can parse them */}
                    {Object.entries(hiddenFields).map(([key, value]) => (
                        <input key={key} type="hidden" name={key} value={value} />
                    ))}

                    <div className="grid gap-2 mb-4">
                        <Label htmlFor="confirm" className="text-sm">
                            Please type <strong className="select-none">delete</strong> to confirm.
                        </Label>
                        <Input
                            id="confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="bg-muted/50"
                            placeholder="delete"
                            autoComplete="off"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={!isConfirmed || isPending}>
                            {isPending ? "Deleting..." : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
