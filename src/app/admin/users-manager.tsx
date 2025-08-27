"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { PlusCircle, Trash2, User as UserIcon } from 'lucide-react';
import type { User } from '@/types';
import { UserContext } from '@/context/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/user-service';

const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;

const profileFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  positions: z.array(z.object({
    fullName: z.string().min(2, 'El nombre completo del cargo es requerido.'),
    shortName: z.string().min(1, 'La abreviatura es requerida.').max(15, 'Máximo 15 caracteres.'),
  })).min(1, 'Se requiere al menos un cargo.').max(3, 'Se permiten hasta 3 cargos.'),
  email: z.string().email(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Debe ser un color hexadecimal válido'),
  frequentTasks: z.string().optional(),
  workHours: z.record(
    z.object({
      active: z.boolean(),
      virtual: z.boolean(),
      start: z.string().optional(),
      end: z.string().optional(),
    })
  ).refine(data => {
      for (const day in data) {
          const { active, start, end } = (data as any)[day];
          if (active) {
            // Require both start and end times when day is active
            if (!start || !end) return false;
            if (!timeRegex.test(start) || !timeRegex.test(end)) return false;
            if (start >= end) return false;
          }
      }
      return true;
  }, {
      message: "Si un día está activo, debe tener tanto hora de inicio como hora de finalización válidas, y la hora de inicio debe ser anterior a la de finalización."
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function UserProfileForm({ user, onUpdate, canEdit }: { user: User, onUpdate: (values: User) => void, canEdit: boolean }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
         defaultValues: {
       ...user,
       email: user.email || '',
      frequentTasks: user.frequentTasks.join('\n'),
      workHours: {
        Monday: { active: user.workHours.Monday?.active || false, virtual: user.workHours.Monday?.virtual || false, start: user.workHours.Monday?.start || '', end: user.workHours.Monday?.end || '' },
        Tuesday: { active: user.workHours.Tuesday?.active || false, virtual: user.workHours.Tuesday?.virtual || false, start: user.workHours.Tuesday?.start || '', end: user.workHours.Tuesday?.end || '' },
        Wednesday: { active: user.workHours.Wednesday?.active || false, virtual: user.workHours.Wednesday?.virtual || false, start: user.workHours.Wednesday?.start || '', end: user.workHours.Wednesday?.end || '' },
        Thursday: { active: user.workHours.Thursday?.active || false, virtual: user.workHours.Thursday?.virtual || false, start: user.workHours.Thursday?.start || '', end: user.workHours.Thursday?.end || '' },
        Friday: { active: user.workHours.Friday?.active || false, virtual: user.workHours.Friday?.virtual || false, start: user.workHours.Friday?.start || '', end: user.workHours.Friday?.end || '' },
        Saturday: { active: user.workHours.Saturday?.active || false, virtual: user.workHours.Saturday?.virtual || false, start: user.workHours.Saturday?.start || '', end: user.workHours.Saturday?.end || '' },
        Sunday: { active: user.workHours.Sunday?.active || false, virtual: user.workHours.Sunday?.virtual || false, start: user.workHours.Sunday?.start || '', end: user.workHours.Sunday?.end || '' },
      }
    },
    disabled: !canEdit,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "positions",
  });

  const watchedWorkHours = form.watch('workHours');

  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayTranslations: { [key: string]: string } = {
      Monday: 'Lunes',
      Tuesday: 'Martes',
      Wednesday: 'Miércoles',
      Thursday: 'Jueves',
      Friday: 'Viernes',
  }

  const formatTime = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  function onSubmit(values: ProfileFormValues) {
    const updatedUser: User = {
        ...user,
        ...values,
        frequentTasks: values.frequentTasks?.split('\n').filter(task => task.trim() !== '') || [],
        workHours: (Object.fromEntries(
          Object.entries(values.workHours).map(([day, hours]) => [
            day,
            { 
              active: (hours as any).active,
              virtual: (hours as any).virtual,
              start: (hours as any).active ? (hours as any).start : undefined,
              end: (hours as any).active ? (hours as any).end : undefined,
            },
          ])
        ) as { [key: string]: any }),
    };
    onUpdate(updatedUser);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ejemplo@taskcanvas.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

         <div>
          <FormLabel>Cargos</FormLabel>
          <FormDescription className="mb-2">
            El cargo principal del usuario. Puede agregar hasta 3.
          </FormDescription>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name={`positions.${index}.fullName` as const}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`positions.${index}.shortName` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Abreviatura</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {canEdit && fields.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {canEdit && fields.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ fullName: '', shortName: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Cargo
            </Button>
          )}
           {form.formState.errors.positions && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.positions.message as any}
              </p>
            )}
        </div>

        <FormField
          control={form.control}
          name="frequentTasks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tareas Frecuentes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Liste las tareas que realiza con frecuencia, una por línea."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Estas pueden ser usadas para poblar rápidamente su agenda semanal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-medium mb-4">Horario laboral</h3>
          <div className="space-y-4">
            {workDays.map((day) => (
              <div key={day} className={cn("p-4 rounded-md border transition-colors", (watchedWorkHours as any)[day]?.active ? 'bg-muted/50' : '')}>
                <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name={`workHours.${day}.active` as const}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between w-full space-y-0">
                          <FormLabel className="text-base font-semibold">
                            {dayTranslations[day]}
                          </FormLabel>
                          <FormControl>
                            <Switch
                                checked={field.value as any}
                                onCheckedChange={field.onChange}
                                disabled={!canEdit}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
                {(watchedWorkHours as any)[day]?.active && (
                    <div className="flex items-center gap-4 pt-4">
                       <FormField
                        control={form.control}
                        name={`workHours.${day}.start` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inicio <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                className="w-24"
                                {...field} 
                                placeholder="HH:mm"
                                required
                                onChange={e => field.onChange(formatTime(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`workHours.${day}.end` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fin <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                  {...field} 
                                  placeholder="HH:mm"
                                  required
                                  onChange={e => field.onChange(formatTime(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`workHours.${day}.virtual` as const}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-center gap-2 ml-auto">
                            <FormLabel>Virtual</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value as any}
                                onCheckedChange={field.onChange}
                                disabled={!canEdit}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                )}
              </div>
            ))}
          </div>
          <FormDescription className="mt-2">
            Active un día para habilitar la configuración de su horario. Los días activos requieren hora de inicio y fin. Los días marcados como virtuales se destacarán en la agenda.
          </FormDescription>
           {form.formState.errors.workHours && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.workHours.message as React.ReactNode}
              </p>
            )}
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Asociado</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="color" className="w-12 h-10 p-1" {...field} />
                  <Input className="w-32" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                Este color se usará para identificarlo en algunas partes de la aplicación.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" itemType='submit'>Guardar Perfil</Button>
      </form>
    </Form>
  );
}

export default function UsersManager({ canManageUsers }: { canManageUsers: boolean }) {
  const { users, setUsers } = React.useContext(UserContext);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newUserDraft, setNewUserDraft] = React.useState<Partial<User> | null>(null);
  const { toast } = useToast();

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleAddUser = () => {
      const draft: Partial<User> = {
        name: '',
        email: '',
        positions: [{ fullName: '', shortName: '' }],
        role: 'user',
        workHours: {
            Monday: { active: false, virtual: false },
            Tuesday: { active: false, virtual: false },
            Wednesday: { active: false, virtual: false },
            Thursday: { active: false, virtual: false },
            Friday: { active: false, virtual: false },
            Saturday: { active: false, virtual: false },
            Sunday: { active: false, virtual: false },
        },
        frequentTasks: [],
        color: '#888888',
      };
      setNewUserDraft(draft);
      setIsCreateOpen(true);
  };

  const handleCreateUser = async (formValues: User) => {
    setIsCreateOpen(false);
    try {
      const created = await userService.create(formValues);
      setUsers(current => [...current, created]);
      toast({
        variant: "success",
        title: "¡Éxito!",
        description: "¡Usuario creado exitosamente!",
      });        
    } catch (error) {
      console.error('Failed to create user', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el usuario",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Perfiles de Usuario</CardTitle>
                <CardDescription>
                    {canManageUsers 
                        ? "Vea y administre la información y configuración de los usuarios."
                        : "Vea la información de los usuarios."
                    }
                </CardDescription>
            </div>
            {canManageUsers && (
                <Button type="submit" onClick={handleAddUser}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Usuario
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        
        
        <Accordion type="single" collapsible className="w-full">
            {users.map((user) => (
            <AccordionItem value={user.id} key={user.id}>
                <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <UserIcon className="h-6 w-6" style={{color: user.color, fill: `${user.color}33`}}/>
                        </div>
                        <div className="flex-1 text-left">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {user.positions.map(p => p.fullName).join(' / ')}
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                    <UserProfileForm user={user} onUpdate={handleUpdateUser} canEdit={canManageUsers} />
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
             <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Crear Usuario</DialogTitle>
             </DialogHeader>
             {newUserDraft && (
               <UserProfileForm user={newUserDraft as User} onUpdate={handleCreateUser} canEdit={true} />
             )}
           </DialogContent>
         </Dialog>
    </Card>
  );
}

