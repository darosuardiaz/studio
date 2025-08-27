export type DaysOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'archived';

export type WorkDay = {
  active: boolean;
  virtual: boolean;
  start?: string;
  end?: string;
};

export type Position = {
  fullName: string;
  shortName: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  positions: Position[];
  role: 'owner' | 'admin' | 'user';
  workHours: { [key: string]: WorkDay };
  frequentTasks: string[];
  color: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  userId: string;
  days?: DaysOfWeek[];
  startDate: string;
  endDate?: string;
  startTime?: string; // "HH:mm"
  duration?: number; // in minutes
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'info' | 'blocker';
  description: string;
  allDay?: boolean;
};

export type Novelty = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  viewed?: string[];
  updatedAt?: string;
};
