"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Bot, Cog, LogOut } from "lucide-react";
import { VoiceAssistant } from "./voice-assistant";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/scenario-planning", label: "Scenario Planning", icon: Bot },
  { href: "/settings", label: "Settings", icon: Cog },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    // Handle special case for assets page since it's not in navItems
    if (pathname === '/assets') return 'My Assets';
    
    const currentNav = navItems.find(item => item.href === pathname);
    return currentNav ? currentNav.label : "Personal Chanakya";
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isLoggedIn');
    }
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-14 items-center justify-center p-2">
            <Link href="/" className="group-data-[collapsible=icon]:hidden">
              <Logo />
            </Link>
            <Link
              href="/"
              className="hidden rounded-lg text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:block"
            >
              <Logo iconOnly={true} />
              <span className="sr-only">Personal Chanakya</span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                    side: "right",
                    align: "center",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout}>
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <h2 className="text-lg font-semibold text-foreground">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <VoiceAssistant />
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
