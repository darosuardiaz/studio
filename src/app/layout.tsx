'use client';

import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import './globals.css';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { MainNav } from '@/components/main-nav';
import { Header } from '@/components/header';
import { UserProvider, UserContext } from '@/context/UserContext';
import { DataProvider, DataContext } from '@/context/DataContext';
import React, { useContext } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseError } from '@/components/SupabaseError';
import { usePathname } from 'next/navigation';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading: userLoading, error: userError } = useContext(UserContext);
  const { loading: dataLoading, error: dataError } = useContext(DataContext);

  // Show error if either context has an error
  if (userError || dataError) {
    return <SupabaseError />;
  }

  if (userLoading || dataLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-semibold text-muted-foreground">Cargando datos de la aplicación...</p>
            <div className="w-64">
              <Skeleton className="h-4 w-full" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <Sidebar className="flex-col border-r" collapsible="icon">
          <MainNav />
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-4 pt-2 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  const isAuthRoute = pathname.includes('/auth') || pathname === '/login';
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased'
        )}
      >
        {isAuthRoute ? (
          <>
            {children}
            <Toaster />
          </>
        ) : (
          <SessionProvider>
            <UserProvider>
              <DataProvider>
                <AppLayout>{children}</AppLayout>
              </DataProvider>
            </UserProvider>
          </SessionProvider>
        )}
      </body>
    </html>
  );
}
