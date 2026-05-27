import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Task, TaskStatus, TaskPriority, TaskCategory } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure database files exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

initDB();

// Helper to read JSON safely
function readJSON<T>(file: string): T {
  try {
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    return [] as unknown as T;
  }
}

// Helper to write JSON safely
function writeJSON<T>(file: string, data: T) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

export const DB = {
  // --- USERS SECTION ---
  getUsers(): any[] {
    return readJSON<any[]>(USERS_FILE);
  },

  getUserByEmail(email: string): any | null {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById(id: string): any | null {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return null;
    // Omit password hash on return
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  async createUser(name: string, email: string, passwordPlain: string): Promise<User> {
    const users = this.getUsers();
    if (this.getUserByEmail(email)) {
      throw new Error('User with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);
    
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      passwordHash,
      streak: 1,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  },

  async verifyPassword(email: string, passwordPlain: string): Promise<User | null> {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) return null;

    // Check and update dynamic streak count on login/active
    await this.updateStreak(user.id);

    const { passwordHash: _, ...safeUser } = this.getUserByEmail(email);
    return safeUser;
  },

  async updateStreak(userId: string): Promise<void> {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return;

    const user = users[index];
    const now = new Date();
    const lastActiveDate = new Date(user.lastActive);
    
    // Reset date hours to compare calendar days
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d2 = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive streak incremented
      user.streak += 1;
    } else if (diffDays > 1) {
      // Broke streak - reset to 1
      user.streak = 1;
    }
    
    user.lastActive = now.toISOString();
    users[index] = user;
    writeJSON(USERS_FILE, users);
  },

  // --- TASKS SECTION ---
  getTasks(userId?: string): Task[] {
    const tasks = readJSON<Task[]>(TASKS_FILE);
    if (userId) {
      return tasks.filter(t => t.userId === userId);
    }
    return tasks;
  },

  getTaskById(id: string): Task | null {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) || null;
  },

  createTask(userId: string, data: Partial<Task>): Task {
    const tasks = this.getTasks();
    const timestamp = new Date().toISOString();

    const newTask: Task = {
      id: 'tsk_' + Math.random().toString(36).substr(2, 9),
      userId,
      title: data.title || 'Untitled Task',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      category: data.category || 'work',
      dueDate: data.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      estimatedTime: data.estimatedTime || 30,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    tasks.push(newTask);
    writeJSON(TASKS_FILE, tasks);
    return newTask;
  },

  updateTask(id: string, userId: string, data: Partial<Task>): Task {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id && t.userId === userId);
    if (index === -1) {
      throw new Error('Task not found or unauthorized');
    }

    const updatedTask: Task = {
      ...tasks[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    tasks[index] = updatedTask;
    writeJSON(TASKS_FILE, tasks);
    return updatedTask;
  },

  deleteTask(id: string, userId: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => !(t.id === id && t.userId === userId));
    const deleted = tasks.length !== filtered.length;
    if (deleted) {
      writeJSON(TASKS_FILE, filtered);
    }
    return deleted;
  }
};
