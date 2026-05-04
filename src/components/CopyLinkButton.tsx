'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({ shareToken }: { shareToken: string }) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        const url = `${window.location.origin}/client/projects/${shareToken}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0 gap-1.5 text-xs"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Client Link
                </>
            )}
        </Button>
    )
}
