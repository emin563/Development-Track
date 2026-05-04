'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { ProjectSchema, ClientSchema, ProjectUpdateSchema, ClientFeedbackSchema, TagSchema } from '@/lib/validations'
import { ProjectFeedback } from '@/types'
import { z } from 'zod'

// Helper to broadcast realtime events
async function broadcastEvent(channelTopic: string, event: string, payload: any) {
  try {
    // SECURITY (Finding 8): Strip nested relation objects to avoid leaking sensitive or large data
    const safePayload = { ...payload }
    delete safePayload.client
    delete safePayload.tags

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !ANON_KEY) {
      console.error("Missing Supabase credentials for broadcast")
      return
    }

    // Use the Supabase Realtime REST API for serverless environments
    // This perfectly avoids dropped WebSocket connections on Vercel
    const restUrl = `${SUPABASE_URL}/realtime/v1/api/broadcast`

    await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            topic: channelTopic,
            event: event,
            payload: safePayload
          }
        ]
      })
    })
  } catch (err) {
    console.error("Broadcast failed", err)
  }
}

export async function addProject(formData: FormData) {
  const supabase = await createClient()

  // Verify authentication before attempting insert
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to add a project.' }
  }

  const validatedFields = ProjectSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) return { error: 'Invalid project data.' }
  const { title, client_id, status, due_date } = validatedFields.data

  const { data, error } = await supabase
    .from('projects')
    .insert([
      { title, client_id, status, due_date, share_token: crypto.randomUUID() }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error adding project:', error)
    return { error: error.message }
  }

  if (data) {
    await broadcastEvent('public-events', 'project_added', data)
  }

  revalidatePath('/')
  return { success: true }
}

export async function addClient(formData: FormData) {
  const supabase = await createClient()

  // Verify authentication before attempting insert
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to add a client.' }
  }

  const validatedFields = ClientSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) return { error: 'Invalid client data.' }
  const { name } = validatedFields.data
  const email = validatedFields.data.email || null

  const avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`

  const { error } = await supabase
    .from('clients')
    .insert([
      { name, email, avatar_url }
    ])

  if (error) {
    console.error('Error adding client:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // RLS ensures users can only delete their own projects
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting project:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/projects')
  return { success: true }
}

export async function deleteClient(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // RLS ensures users can only delete their own clients
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    return { error: error.message }
  }

  revalidatePath('/clients')
  revalidatePath('/')
  return { success: true }
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const { error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating project status:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/projects')
  return { success: true }
}

export async function addProjectUpdate(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const validatedFields = ProjectUpdateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) return { error: 'Invalid update data.' }
  const { project_id, version, description, resource_url } = validatedFields.data

  // Ensure user owns project
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .single()

  if (pError || !project) {
    console.error("addProjectUpdate PROJECT NOT FOUND:", project_id, pError)
    return { error: 'Project not found or accessible.' }
  }


  const { error } = await supabase
    .from('project_updates')
    .insert([
      { project_id, version, description, resource_url: resource_url || null }
    ])

  if (error) {
    console.error('Error adding project update:', error)
    return { error: error.message }
  }

  // Broadcast
  const { data: insertedUpdate } = await supabase
    .from('project_updates')
    .select('*')
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (insertedUpdate) {
    await broadcastEvent('public-updates', 'update_added', insertedUpdate)
  }

  revalidatePath(`/projects/${project_id}`)
  return { success: true }
}

export async function submitClientFeedback(formData: FormData) {
  const supabase = await createClient()

  // We do NOT require user authentication here, because this is for clients!
  const validatedFields = ClientFeedbackSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) return { error: 'Required fields are missing or invalid.' }
  const { shareToken, projectId, clientName, message } = validatedFields.data
  const updateId = validatedFields.data.updateId || null

  // Call the Postgres function securely
  const { data, error } = await supabase
    .rpc('submit_project_feedback_by_share_token', {
      token: shareToken,
      p_project_id: projectId,
      update_uuid: updateId || null,
      c_name: clientName,
      m_text: message
    })

  if (error) {
    console.error('Error submitting feedback:', error)
    return { error: error.message || 'Failed to submit feedback' }
  }

  // We need to fetch the actual row securely since the standard browser client is anonymous and blocked by RLS.
  // The 'get_client_all_feedbacks_by_share_token' RPC is SECURITY DEFINER, so it bypasses RLS!
  const { data: allFeedbacks } = await supabase
    .rpc('get_client_all_feedbacks_by_share_token', { token: shareToken })

  const feedbacksList = (allFeedbacks as unknown as ProjectFeedback[]) || []
  if (feedbacksList.length > 0) {
    const insertedFeedback = feedbacksList[0]
    if (insertedFeedback.client_name === clientName) {
      await broadcastEvent('public-feedbacks', 'feedback_changed', insertedFeedback)
    }
  }

  // Adding a revalidatePath delays function termination slightly and ensures soft reloads from the client
  revalidatePath(`/client/projects/${shareToken}`)

  return { success: true }
}

export async function resolveClientFeedback(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return; // Silent return for unauthorized

  const feedbackId = formData.get('feedbackId') as string
  const projectId = formData.get('projectId') as string | null

  if (!feedbackId) return;

  const { error } = await supabase
    .from('project_feedbacks')
    .update({ status: 'Resolved' })
    .eq('id', feedbackId)

  if (error) {
    console.error('Error resolving feedback:', error)
    return;
  }

  const { data: updatedFeedback } = await supabase.from('project_feedbacks').select('*').eq('id', feedbackId).single()
  if (updatedFeedback) {
    await broadcastEvent('public-feedbacks', 'feedback_changed', updatedFeedback)
  }

  if (projectId) revalidatePath(`/projects/${projectId}`)
  revalidatePath('/feedbacks')
  revalidatePath('/')
}

export async function reopenClientFeedback(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return;

  const feedbackId = formData.get('feedbackId') as string
  const projectId = formData.get('projectId') as string | null

  if (!feedbackId) return;

  const { error } = await supabase
    .from('project_feedbacks')
    .update({ status: 'Open' })
    .eq('id', feedbackId)

  if (error) {
    console.error('Error reopening feedback:', error)
    return;
  }

  const { data: updatedFeedback } = await supabase.from('project_feedbacks').select('*').eq('id', feedbackId).single()
  if (updatedFeedback) {
    await broadcastEvent('public-feedbacks', 'feedback_changed', updatedFeedback)
  }

  if (projectId) revalidatePath(`/projects/${projectId}`)
  revalidatePath('/feedbacks')
  revalidatePath('/')
}

export async function respondToFeedback(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return;

  const feedbackId = formData.get('feedbackId') as string
  const projectId = formData.get('projectId') as string | null
  const response = formData.get('response') as string

  if (!feedbackId || !response) return;

  const { error } = await supabase
    .from('project_feedbacks')
    .update({ developer_response: response })
    .eq('id', feedbackId)

  if (error) {
    console.error('Error responding to feedback:', error)
    return;
  }

  const { data: updatedFeedback } = await supabase.from('project_feedbacks').select('*').eq('id', feedbackId).single()
  if (updatedFeedback) {
    await broadcastEvent('public-feedbacks', 'feedback_changed', updatedFeedback)
  }

  if (projectId) revalidatePath(`/projects/${projectId}`)
  revalidatePath('/feedbacks')
  revalidatePath('/')
}

export async function deleteClientFeedback(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return;

  const feedbackId = formData.get('feedbackId') as string
  const projectId = formData.get('projectId') as string | null

  if (!feedbackId) return;

  const { error } = await supabase
    .from('project_feedbacks')
    .delete()
    .eq('id', feedbackId)

  if (error) {
    console.error('Error deleting feedback:', error)
    return;
  }

  // Broadcast deletion to remove from client portal without them refreshing
  await broadcastEvent('public-feedbacks', 'feedback_deleted', { id: feedbackId })

  if (projectId) revalidatePath(`/projects/${projectId}`)
  revalidatePath('/feedbacks')
  revalidatePath('/')
}

export async function deleteProjectUpdate(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return;

  const updateId = formData.get('updateId') as string
  const projectId = formData.get('projectId') as string | null

  if (!updateId) return;

  const { error } = await supabase
    .from('project_updates')
    .delete()
    .eq('id', updateId)

  if (error) {
    console.error('Error deleting update:', error)
    return;
  }

  // Broadcast deletion to remove from client portal
  await broadcastEvent('public-updates', 'update_deleted', { id: updateId })

  if (projectId) revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
}

export async function createTag(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const validatedFields = TagSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) return { error: "Tag name is required and color must be valid" }
  const { name, color } = validatedFields.data

  const { error } = await supabase.from('tags').insert({ name, color, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/tags')
  return { success: true }
}

export async function deleteTag(tagId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // RLS enforces ownership, but be explicit for safety
  const { error } = await supabase.from('tags').delete().eq('id', tagId).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/tags')
  revalidatePath('/projects')
  revalidatePath('/clients')
  return { success: true }
}

export async function setProjectTags(projectId: string, tagIds: string[]): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Delete existing, then insert new
  const { error: delError } = await supabase.from('project_tags').delete().eq('project_id', projectId)
  if (delError) return { error: delError.message }

  if (tagIds.length > 0) {
    const rows = tagIds.map(tag_id => ({ project_id: projectId, tag_id }))
    const { error: insError } = await supabase.from('project_tags').insert(rows)
    if (insError) return { error: insError.message }
  }

  revalidatePath('/projects')
  revalidatePath('/')
  return { success: true }
}

export async function setClientTags(clientId: string, tagIds: string[]): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error: delError } = await supabase.from('client_tags').delete().eq('client_id', clientId)
  if (delError) return { error: delError.message }

  if (tagIds.length > 0) {
    const rows = tagIds.map(tag_id => ({ client_id: clientId, tag_id }))
    const { error: insError } = await supabase.from('client_tags').insert(rows)
    if (insError) return { error: insError.message }
  }

  revalidatePath('/clients')
  revalidatePath('/')
  return { success: true }
}

export async function regenerateShareToken(projectId: string): Promise<{ success?: boolean; error?: string }> {
  // SECURITY (Finding 3): Validate uuid format
  const parsedId = z.string().uuid().safeParse(projectId)
  if (!parsedId.success) return { error: "Invalid project ID format" }
  const validProjectId = parsedId.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // SECURITY (Finding 2): Confirm ownership before mutating
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', validProjectId)
    .single()
  if (pError || !project) return { error: 'Project not found or not authorized.' }

  const newToken = crypto.randomUUID()
  const { error } = await supabase
    .from('projects')
    .update({ share_token: newToken })
    .eq('id', validProjectId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${validProjectId}`)
  revalidatePath(`/projects`)
  revalidatePath('/')
  return { success: true }
}
