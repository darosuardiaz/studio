import { supabase } from "@/lib/supabase";
import { authClient } from '@/lib/supabase/auth';
import type { User } from "@/types";


export const userService = {
    async getAll(): Promise<User[]> {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      if (!data) return [];
  
      const users = data.map((user) => {
        return {
          workHours: user.work_hours,
          frequentTasks: user.frequent_tasks,
          ...user,
        };
      });
  
      return users;
    },
  
    async getById(id: string): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
  
      const user = {
        workHours: data.work_hours,
        frequentTasks: data.frequent_tasks,
        ...data,
      };
  
      return user;
    },
  
    async create(user: User): Promise<User> {
      // enviar invitacion por email (crea el usuario en supabase)
      const { data: _authData, error: authError } = await authClient.inviteUserByEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/sign-up`,
        data: {
          name: user.name,
          role: user.role,
        },
      });

      if (authError) {
        console.error(authError);
        throw authError.message;
      };

      // insertar en db
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: _authData.user?.id,
          name: user.name,
          email: user.email,
          role: user.role,
          work_hours: user.workHours,
          frequent_tasks: user.frequentTasks,
          positions: user.positions,
          color: user.color,
        })
        .select()
        .single();
      
      if (error) {
        console.error(error);
        throw error.message;
      };
  
      const createdUser: User = {
        workHours: data.work_hours,
        frequentTasks: data.frequent_tasks,
        ...data,
      };
  
      return createdUser;
    },
  
    async update(id: string, updates: Partial<User>): Promise<User> {
      const { workHours, frequentTasks, ...rest } = updates;
      const updatePayload = {
        ...rest,
        ...(typeof workHours !== 'undefined' ? { work_hours: workHours } : {}),
        ...(typeof frequentTasks !== 'undefined' ? { frequent_tasks: frequentTasks } : {}),
      };
  
      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
  
      const updatedUser: User = {
        workHours: (data as any).work_hours,
        frequentTasks: (data as any).frequent_tasks,
        ...data,
      };
  
      return updatedUser;
    },
  
    async upsertMany(users: User[]): Promise<User[]> {
      const { data, error } = await supabase
        .from('users')
        .upsert(users)
        .select();
      
      if (error) throw error;
      return data || [];
    }
};