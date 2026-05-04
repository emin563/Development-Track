import { z } from "zod"

export const ProjectSchema = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title is too long"),
    client_id: z.string().uuid("Invalid client selected"),
    status: z.enum(["Active", "Pending", "Completed"]),
    due_date: z.string().min(1, "Due date is required"),
})

export const ClientSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
})

export const ProjectUpdateSchema = z.object({
    project_id: z.string().uuid("Invalid project"),
    version: z.string().min(1, "Version is required").max(100, "Version is too long"),
    description: z.string().min(1, "Description is required").max(5000, "Description is too long"),
    resource_url: z.string().url("Invalid URL").optional().or(z.literal("")),
})

export const ClientFeedbackSchema = z.object({
    shareToken: z.string().uuid("Invalid token"),
    projectId: z.string().uuid("Invalid project"),
    updateId: z.string().uuid("Invalid update").nullable().optional().or(z.literal("")),
    clientName: z.string().min(1, "Your name is required").max(255, "Name is too long"),
    message: z.string().min(1, "Message is required").max(5000, "Message is too long"),
})

export const TagSchema = z.object({
    name: z.string().min(1, "Tag name is required").max(50, "Tag name is too long").trim(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").default("#6366f1"),
})
