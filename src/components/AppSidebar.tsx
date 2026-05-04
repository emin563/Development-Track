import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, Folder, Users, Settings, LogOut, User, MessageSquare, Tag } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { signout } from "@/app/login/actions"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"

const menuGroups = [
  {
    label: "Main",
    items: [
      { title: "Home", url: "/", icon: Home },
    ]
  },
  {
    label: "Management",
    items: [
      { title: "Projects", url: "/projects", icon: Folder },
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Feedbacks", url: "/feedbacks", icon: MessageSquare },
      { title: "Tags", url: "/tags", icon: Tag },
    ]
  },
  {
    label: "System",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ]
  }
]

export async function AppSidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-bold tracking-tight text-primary">ProjectTracker</h2>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />}>
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-2 truncate">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium truncate">{user.email}</span>
              </div>
              <ThemeToggle />
            </div>
            <form action={signout}>
              <SidebarMenuButton type="submit" variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </form>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">&copy; 2026 ProjectTracker</span>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
