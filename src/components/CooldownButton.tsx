'use client'

import { useState, useEffect } from 'react'

interface CooldownButtonProps {
    children: React.ReactNode
    formAction: (formData: FormData) => void
    cooldownSeconds?: number
    className?: string
}

export function CooldownButton({ children, formAction, cooldownSeconds = 60, className }: CooldownButtonProps) {
    const [cooldown, setCooldown] = useState(0)
    const [isPending, setIsPending] = useState(false)

    useEffect(() => {
        const stored = sessionStorage.getItem('cooldown_expiry')
        if (stored) {
            const diff = Math.floor((parseInt(stored) - Date.now()) / 1000)
            if (diff > 0) {
                setCooldown(diff)
            }
        }
    }, [])

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const handleAction = async (formData: FormData) => {
        setIsPending(true)
        try {
            await formAction(formData)
        } finally {
            setIsPending(false)
            setCooldown(cooldownSeconds)
            sessionStorage.setItem('cooldown_expiry', (Date.now() + cooldownSeconds * 1000).toString())
        }
    }

    const isDisabled = cooldown > 0 || isPending

    return (
        <button
            type="submit"
            formAction={handleAction}
            disabled={isDisabled}
            className={className}
            style={{ opacity: isDisabled ? 0.6 : 1 }}
        >
            {cooldown > 0 ? `Wait ${cooldown}s` : isPending ? 'Sending...' : children}
        </button>
    )
}
