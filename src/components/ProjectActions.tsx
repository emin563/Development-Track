'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, RefreshCw, Link as LinkIcon, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteProject, updateProjectStatus, setProjectTags } from '@/app/actions'
import { toast } from 'sonner'
import { Project, ProjectStatus, Tag } from '@/types'
import { ManageTagsDialog } from '@/components/ManageTagsDialog'

const STATUS_OPTIONS: ProjectStatus[] = ['Active', 'Pending', 'Completed']

export function ProjectActions({ project, allTags }: { project: Project, allTags: Tag[] }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleStatusChange(status: ProjectStatus) {
    setIsPending(true)
    const result = await updateProjectStatus(project.id, status)
    setIsPending(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Status changed to ${status}`)
    }
  }

  async function handleDelete() {
    setIsPending(true)
    const result = await deleteProject(project.id)
    setIsPending(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Project deleted successfully')
    }
    setShowDeleteDialog(false)
  }

  function handleCopyClientLink() {
    if (!project.share_token) {
      toast.error('This project does not have a secret link yet.')
      return
    }
    const url = `${window.location.origin}/client/projects/${project.share_token}`
    navigator.clipboard.writeText(url)
    toast.success('Secret link copied to clipboard!')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={isPending} className="h-8 w-8" />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <RefreshCw className="mr-2 h-4 w-4" />
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={status === project.status}
                  className={status === project.status ? 'font-semibold text-primary' : ''}
                >
                  {status}
                  {status === project.status && ' ✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <ManageTagsDialog
            id={project.id}
            initialTagIds={(project.tags || []).map(t => t.id)}
            itemName={project.title}
            allTags={allTags}
            onSave={setProjectTags}
          />
          <DropdownMenuItem onClick={() => window.location.href = `/projects/${project.id}`}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Manage Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyClientLink}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Copy Client Link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This project will be permanently removed from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
