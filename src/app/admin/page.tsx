'use client';

import React, { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { UserContext } from '@/context/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import UsersManager from '@/app/admin/users-manager';
import NoveltiesManager from '@/app/admin/novelties-manager';
import { useSession } from 'next-auth/react';
import TasksManager from '../tasks/page';



export default function AdminPage() {
    const { currentUser } = useContext(UserContext);
    const { data: session, status } = useSession()

    if (status === 'loading') return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
    
    if (session && session.user && !(session.user.role === 'admin' || session.user.role === 'owner')) {
      return (
        <div className="container mx-auto py-10 flex flex-col items-center justify-center text-center">
            <Lock className="h-16 w-16 text-destructive mb-4"/>
            <h1 className="text-3xl font-bold font-headline">Acceso Denegado</h1>
            <p className="text-lg text-muted-foreground mt-2">
                No tienes los permisos necesarios para acceder a esta sección.
            </p>
        </div>
      )
    }

    const canAccessAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    return (
        <div className="container mx-auto py-10">
             <h1 className="text-3xl font-bold font-headline mb-6">Panel de Administración</h1>
             <Tabs defaultValue="tasks">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="tasks">Gestionar Tareas</TabsTrigger>
                    <TabsTrigger value="users">Gestionar Usuarios</TabsTrigger>
                    <TabsTrigger value="novelties">Gestionar Novedades</TabsTrigger>
                </TabsList>
                <TabsContent value="tasks">
                    <TasksManager />
                </TabsContent>
                <TabsContent value="users">
                    <UsersManager canManageUsers={canAccessAdmin} />
                </TabsContent>
                <TabsContent value="novelties">
                    <NoveltiesManager canManageNovelties={canAccessAdmin} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
