export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  streak: number;
  lastActive: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'work' | 'personal' | 'growth' | 'finance' | 'other';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string; // Title style YYYY-MM-DD
  estimatedTime?: number; // duration in minutes
  createdAt: string;
  updatedAt: string;
}

export interface AISuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  estimatedTime?: number;
}

export interface AIInsights {
  productivityScore: number; // 0 to 100
  summary: string;
  strengths: string[];
  recommendations: string[];
}
