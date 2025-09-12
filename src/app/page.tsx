'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return 
    
    if (session) {
      redirect('/canvas')
    } else {
      redirect('/auth/login')
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-muted-foreground">Verificando sesión...</p>
          <div className="w-64">
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return null
}

 