'use client';

import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Task, User, Novelty } from '@/types';
import { Download, PlusCircle, Edit, Calendar as CalendarIcon, Trash2, Archive, User as UserIcon, Lock, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { DataContext } from '@/context/DataContext';
import { UserContext } from '@/context/UserContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';


const priorityVariant = {
  low: 'outline',
  medium: 'secondary',
  high: 'destructive',
} as const;

const statusVariant = {
  todo: 'outline',
  'in-progress': 'default',
  done: 'secondary',
  archived: 'secondary',
} as const;

const dayMap: { [key: string]: string } = {
    Monday: 'Lun',
    Tuesday: 'Mar',
    Wednesday: 'Mié',
    Thursday: 'Jue',
    Friday: 'Vie',
    Saturday: 'Sáb',
    Sunday: 'Dom',
};

const weekDays: { id: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday", label: string }[] = [
    { id: 'Monday', label: 'Lunes' },
    { id: 'Tuesday', label: 'Martes' },
    { id: 'Wednesday', label: 'Miércoles' },
    { id: 'Thursday', label: 'Jueves' },
    { id: 'Friday', label: 'Viernes' },
    { id: 'Saturday', label: 'Sábado' },
    { id: 'Sunday', label: 'Domingo' },
];

const statusMap: { [key: string]: string } = {
    todo: 'Por hacer',
    'in-progress': 'En progreso',
    done: 'Hecho',
    archived: 'Archivado',
};

const taskFormSchema = z.object({
  id: z.string(),
  title: z.string().min(2, "El título debe tener al menos 2 caracteres."),
  description: z.string().optional(),
  userId: z.string({ required_error: "Por favor seleccione un usuario." }),
  days: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startTime: z.string().optional(),
  duration: z.coerce.number().optional().or(z.literal(0)),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in-progress", "done", "archived"]),
  notes: z.string().optional(),
}).refine(data => data.startDate || (data.days && data.days.length > 0), {
    message: "Debe seleccionar al menos una fecha de inicio o un día recurrente.",
    path: ["startDate"], 
}).refine(data => {
  if(data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "La fecha de fin no puede ser anterior a la de inicio.",
  path: ["endDate"],
});


type TaskFormValues = z.infer<typeof taskFormSchema>;

function EditTaskForm({ task, onUpdate, onDelete, closeDialog }: { task: Task, onUpdate: (values: Task) => void, onDelete: (taskId: string) => void, closeDialog: () => void }) {
    const { users } = useContext(UserContext);

    if (!task) {
        return null;
    }

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            ...task,
            days: task.days || [],
            startDate: task.startDate ? new Date(task.startDate) : undefined,
            endDate: task.endDate ? new Date(task.endDate) : undefined,
            description: task.description || '',
            notes: task.notes || '',
            startTime: task.startTime || '',
            duration: task.duration || 0,
        },
    });

    const selectedUserId = useWatch({ control: form.control, name: 'userId' });

    function onSubmit(values: TaskFormValues) {
        onUpdate({
            ...task,
            ...values,
            startDate: values.startDate ? values.startDate.toISOString() : undefined,
            endDate: values.endDate ? values.endDate.toISOString() : undefined,
            startTime: values.startTime === 'none' ? '' : values.startTime,
            description: values.description ?? '',
        } as Task);
        closeDialog();
    }

    const handleArchive = () => {
        onUpdate({ ...task, status: 'archived' });
        closeDialog();
    }

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem><FormLabel>Asignar a</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar un usuario" /></SelectTrigger></FormControl><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio</FormLabel>
                         <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                         <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => form.getValues('startDate') ? date < form.getValues('startDate')! : false}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="days"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Días recurrentes</FormLabel>
                        <FormDescription>
                          Seleccione los días en que esta tarea se repetirá.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                      {weekDays.map((day) => (
                        <FormField
                          key={day.id}
                          control={form.control}
                          name="days"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), day.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== day.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de inicio (opcional)</FormLabel>
                        <FormControl><Input placeholder="HH:mm" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem><FormLabel>Duración en minutos</FormLabel><FormControl><Input type="number" step="30" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   
                    <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem><FormLabel>Prioridad</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar prioridad" /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Baja</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="todo">Por hacer</SelectItem><SelectItem value="in-progress">En progreso</SelectItem><SelectItem value="done">Hecho</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                </div>
                
                 <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notas Adicionales</FormLabel><FormControl><Textarea placeholder="Añada notas o comentarios sobre la tarea..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="flex justify-between gap-2 pt-4">
                    <div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" ><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(task.id)}>Continuar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" /> Archivar</Button>
                        <Button type="submit">Guardar Cambios</Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}

function TasksTable({ tasks, onEdit, canManageTasks }: { tasks: Task[], onEdit: (task: Task) => void, canManageTasks: boolean }) {
    const { users } = useContext(UserContext);
    if (tasks.length === 0) {
        return (
            <div className="h-24 text-center flex justify-center items-center">
                No se encontraron tareas con los filtros actuales.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Programación</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                        <div className="font-bold">{task.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</div>
                    </TableCell>
                    <TableCell>{users.find((u) => u.id === task.userId)?.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {task.startDate && (
                          <Badge variant="outline">
                            Inicio: {format(new Date(task.startDate), 'd MMM yyyy', {locale: es})}
                          </Badge>
                        )}
                        {task.endDate && (
                          <Badge variant="outline">
                            Fin: {format(new Date(task.endDate), 'd MMM yyyy', {locale: es})}
                          </Badge>
                        )}
                        {task.days && task.days.length > 0 && <div className="flex gap-1 flex-wrap">{task.days.map(d => <Badge variant="secondary" key={d}>{dayMap[d]}</Badge>)}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[task.priority]} className="capitalize">
                        {task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : 'Alta'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[task.status as keyof typeof statusVariant]} className="capitalize">
                        {statusMap[task.status as keyof typeof statusMap]}
                      </Badge>
                    </TableCell>
                     {canManageTasks && (
                     <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
    )
}


const newTaskFormSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres.'),
  description: z.string().optional(),
  userId: z.string({ required_error: 'Por favor seleccione un usuario.' }),
  days: z.array(z.string()).optional(),
  startDate: z.date({ required_error: 'Por favor seleccione una fecha de inicio.' }),
  endDate: z.date().optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')
    .optional()
    .or(z.literal('')),
  duration: z.coerce.number().optional().or(z.literal(0)),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in-progress', 'done']),
}).refine(data => data.startDate || (data.days && data.days.length > 0), {
    message: "Debe seleccionar al menos una fecha de inicio o un día recurrente.",
    path: ["startDate"],
}).refine(data => {
  if(data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "La fecha de fin no puede ser anterior a la de inicio.",
  path: ["endDate"],
});

function TaskCreatorForm({ closeDialog }: { closeDialog: () => void }) {
  const { users } = useContext(UserContext);
  const { addTask } = useContext(DataContext);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof newTaskFormSchema>>({
    resolver: zodResolver(newTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      userId: '',
      days: [],
      priority: 'medium',
      status: 'todo',
      duration: 0,
      startTime: '',
    },
  });

  async function onSubmit(values: z.infer<typeof newTaskFormSchema>) {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate?.toISOString() || undefined,
      days: values.days as Task['days'] || [],
      description: values.description || '',
    };
    try {
      await addTask(newTask);
      toast({
        variant: "success",
        title: "¡Éxito!",
        description: "¡Tarea creada exitosamente!",
      });
      closeDialog();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear la tarea. Por favor, inténtalo de nuevo.",
      });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asignar a</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar un usuario" /></SelectTrigger></FormControl>
                <SelectContent>
                  {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={'outline'} className={cn('pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                        {field.value ? (format(field.value, 'PPP', { locale: es })) : (<span>Seleccionar fecha</span>)}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={'outline'} className={cn('pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                        {field.value ? (format(field.value, 'PPP', { locale: es })) : (<span>Seleccionar fecha</span>)}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => form.getValues('startDate') ? date < form.getValues('startDate')! : false} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="days"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Días recurrentes</FormLabel>
                <FormDescription>
                  Si se elige, la tarea se repetirá en los días seleccionados entre la fecha de inicio y fin.
                </FormDescription>
              </div>
              <div className="grid grid-cols-4 gap-2">
              {weekDays.map((day) => (
                <FormField
                  key={day.id}
                  control={form.control}
                  name="days"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={day.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), day.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== day.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {day.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de inicio (opcional)</FormLabel>
                <FormControl><Input placeholder="HH:mm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración en minutos (opcional)</FormLabel>
                <FormControl><Input type="number" step="30" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar prioridad" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción / Notas</FormLabel>
              <FormControl><Textarea placeholder="" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Cancelar</Button>
            <Button type="submit">Crear Tarea</Button>
        </div>
      </form>
    </Form>
  );
}

export default function TasksManager() {
  const { tasks, updateTask, deleteTask } = useContext(DataContext);
  const { users, currentUser } = useContext(UserContext);
  const [filters, setFilters] = useState({
    user: 'all',
    status: 'all',
    day: 'all',
    searchTerm: '',
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { data: session, status } = useSession();
  const [isTaskCreatorOpen, setIsTaskCreatorOpen] = useState(false);

  // All useMemo hooks must be called before any early returns
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const userMatch = filters.user === 'all' || task.userId === filters.user;
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const dayMatch = filters.day === 'all' || (task.days && task.days.includes(filters.day as any));
      const searchMatch =
        filters.searchTerm === '' ||
        task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      return userMatch && statusMatch && dayMatch && searchMatch;
    });
  }, [tasks, filters]);

  const activeTasks = useMemo(() => filteredTasks.filter(t => t.status !== 'archived'), [filteredTasks]);
  const archivedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'archived'), [filteredTasks]);

  // Early returns after all hooks have been called
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

  const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleUpdateTask = (updatedTask: Task) => {
    updateTask(updatedTask);
    setEditingTask(null);
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setEditingTask(null);
  }

  const exportToCSV = (tasksToExport: Task[]) => {
    const headers = ['ID', 'Título', 'Descripción', 'Usuario', 'Días Recurrentes', 'Fecha Inicio', 'Fecha Fin', 'Prioridad', 'Estado', 'Notas'];
    const rows = tasksToExport.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      users.find(u => u.id === task.userId)?.name || '',
      task.days ? `"${task.days.map(d => dayMap[d]).join(', ')}"` : '',
      task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
      task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '',
      task.priority,
      statusMap[task.status as keyof typeof statusMap] || task.status,
      `"${(task.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lista_de_tareas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div>
            <CardTitle>Gestor de Tareas</CardTitle>
            <CardDescription>
                Cree, edite, filtre y exporte todas las tareas del sistema.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">  
          {/* TABS SELECTOR */}
          <div className="flex items-center justify-between mb-4">
            {canManageTasks && (
              <TabsList>
                <TabsTrigger value="active">Activas</TabsTrigger>
                <TabsTrigger value="archived">Archivadas</TabsTrigger>
              </TabsList>
            )}

            {/* CREAR / EXPORTAR */}
            {canManageTasks && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsTaskCreatorOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Tarea
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(filteredTasks)} className="bg-white border-gray-300 shadow-sm hover:bg-gray-50">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Todo
                </Button>
              </div>
            )}
          </div>
            
          {/* FILTROS */}
          <div className="mb-4 flex flex-col md:flex-row gap-2">
            {/* BUSCADOR */}
            <Input
              placeholder="Buscar por título o descripción..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="max-w-sm"
            />

            {/* FILTRO POR USUARIO */}
            <Select
            value={filters.user}
            onValueChange={(value) => handleFilterChange('user', value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Usuarios</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* FILTRO POR ESTADO */}
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="todo">Por hacer</SelectItem>
                <SelectItem value="in-progress">En progreso</SelectItem>
                <SelectItem value="done">Hecho</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
              
            {/* FILTRO POR DIA */}
            <Select
              value={filters.day}
              onValueChange={(value) => handleFilterChange('day', value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por día" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Días</SelectItem>
                {Object.entries(dayMap).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TABS */}
          <TabsContent value="active">
            <TasksTable tasks={activeTasks} onEdit={setEditingTask} canManageTasks={canManageTasks} />
          </TabsContent>
          <TabsContent value="archived">
            <TasksTable tasks={archivedTasks} onEdit={setEditingTask} canManageTasks={canManageTasks} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
      
    <Dialog open={!!editingTask} onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}>
        <DialogContent className="max-w-2xl grid-rows-[auto,1fr,auto] p-0 max-h-[90dvh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Editar Tarea</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-6">
              {editingTask && (
                <EditTaskForm
                  task={editingTask}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  closeDialog={() => setEditingTask(null)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
    </Dialog>

    <Dialog open={isTaskCreatorOpen} onOpenChange={setIsTaskCreatorOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
            </DialogHeader>
            <TaskCreatorForm closeDialog={() => setIsTaskCreatorOpen(false)}/>
        </DialogContent>
    </Dialog>
    </>
  );
}