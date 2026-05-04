'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// ── Zod Schemas ──────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
})

const SignupSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
})

const EmailSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
})

const PasswordPairSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  confirm_password: z.string().min(6).max(128),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

// ── Auth Actions ──────────────────────────────────────────

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    redirect(`/login?message=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  // SECURITY (Finding 6): Public signup is enabled. 
  // Ensure that Rate Limiting and CAPTCHA are enabled in the Supabase Dashboard
  // to prevent account enumeration, spam registrations, and email bombing.
  const parsed = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    redirect(`/signup?message=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp(parsed.data)

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}`)
  }

  redirect(`/login?message=${encodeURIComponent('Success! Check your email to verify your account.')}`)
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function recoverPassword(formData: FormData) {
  // SECURITY (Finding 7): This endpoint is vulnerable to email bombing.
  // The client-side CooldownButton is purely cosmetic. Ensure RATE_LIMIT_EMAIL_SENT 
  // is strictly configured in the Supabase Dashboard.
  const parsed = EmailSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    redirect(`/forgot-password?message=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`)
  }

  redirect(`/forgot-password?message=${encodeURIComponent('Success. Check your email for the password reset link.')}`)
}

// ── Shared password update core (Finding 3 dedup) ─────────

async function _updatePasswordCore(formData: FormData, redirectOnError: string, redirectOnSuccess: string) {
  // SECURITY (Finding 1): Prevent Open Redirect by sanitizing paths
  let safeErrorRedirect = redirectOnError.startsWith('/') && !redirectOnError.startsWith('//') ? redirectOnError : '/'
  let safeSuccessRedirect = redirectOnSuccess.startsWith('/') && !redirectOnSuccess.startsWith('//') ? redirectOnSuccess : '/'

  const parsed = PasswordPairSchema.safeParse({
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  })

  if (!parsed.success) {
    redirect(`${safeErrorRedirect}?message=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    redirect(`${safeErrorRedirect}?message=${encodeURIComponent(error.message)}`)
  }

  redirect(`${safeSuccessRedirect}?message=${encodeURIComponent('Password successfully updated.')}`)
}

export async function updatePassword(formData: FormData) {
  return _updatePasswordCore(formData, '/update-password', '/')
}

export async function changePasswordSettings(formData: FormData) {
  return _updatePasswordCore(formData, '/settings', '/settings')
}

