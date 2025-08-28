"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, User, Settings } from "lucide-react"
import { signOut, useSession, signIn } from "next-auth/react"

export function UserNav() {
  const { data: session, status } = useSession()

  if (!session) {
    return (
      <Button variant="ghost" onClick={() => signIn("google", { callbackUrl: "/" })}>
        Iniciar sesión
      </Button>
    )
  }

  const userName = session.user?.name ?? "Usuario"
  const userEmail = session.user?.email ?? ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-full justify-start gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user?.image ?? undefined} />
            <AvatarFallback>{userName?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
            <span className="font-medium">{userName}</span>
            {userEmail ? (
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            ) : null}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/auth/login' })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
