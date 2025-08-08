import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User types
export type UserRole = 'student' | 'teacher' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  school?: string;
  grade?: string;
  subjects?: string[];
}

// Classroom types
export interface Classroom {
  id: string;
  name: string;
  subject: string;
  description: string;
  code: string;
  teacherId: string;
  teacherName: string;
  students: string[];
  createdAt: Date;
  coverImage?: string;
}

// Project types
export interface Project {
  id: string;
  title: string;
  description: string;
  classroomId: string;
  teacherId: string;
  dueDate: Date;
  createdAt: Date;
  tasks: Task[];
  attachments?: Attachment[];
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string[];
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  chatType: 'student' | 'class';
  classroomId: string;
  timestamp: Date;
  mentions?: string[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

// Store interfaces
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

interface ClassroomState {
  classrooms: Classroom[];
  currentClassroom: Classroom | null;
  addClassroom: (classroom: Classroom) => void;
  updateClassroom: (id: string, updates: Partial<Classroom>) => void;
  deleteClassroom: (id: string) => void;
  setCurrentClassroom: (classroom: Classroom | null) => void;
  joinClassroom: (code: string, userId: string) => boolean;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
}

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  getMessagesForClassroom: (classroomId: string, chatType: 'student' | 'class') => ChatMessage[];
}

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Create stores
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
    }),
    { name: 'auth-storage' }
  )
);

export const useClassroomStore = create<ClassroomState>()((set, get) => ({
  classrooms: [
    // Mock data
    {
      id: '1',
      name: 'Advanced Mathematics',
      subject: 'Mathematics',
      description: 'Calculus and advanced mathematical concepts',
      code: 'MATH101',
      teacherId: 'teacher1',
      teacherName: 'Dr. Sarah Johnson',
      students: ['student1', 'student2', 'student3'],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Modern Physics',
      subject: 'Physics',
      description: 'Quantum mechanics and relativity',
      code: 'PHYS201',
      teacherId: 'teacher1',
      teacherName: 'Dr. Sarah Johnson',
      students: ['student1', 'student4'],
      createdAt: new Date('2024-01-20'),
    },
  ],
  currentClassroom: null,
  addClassroom: (classroom) =>
    set((state) => ({ classrooms: [...state.classrooms, classroom] })),
  updateClassroom: (id, updates) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  deleteClassroom: (id) =>
    set((state) => ({
      classrooms: state.classrooms.filter((c) => c.id !== id),
    })),
  setCurrentClassroom: (classroom) => set({ currentClassroom: classroom }),
  joinClassroom: (code, userId) => {
    const classroom = get().classrooms.find((c) => c.code === code);
    if (classroom && !classroom.students.includes(userId)) {
      set((state) => ({
        classrooms: state.classrooms.map((c) =>
          c.code === code
            ? { ...c, students: [...c.students, userId] }
            : c
        ),
      }));
      return true;
    }
    return false;
  },
}));

export const useProjectStore = create<ProjectState>()((set) => ({
  projects: [
    // Mock data
    {
      id: '1',
      title: 'Calculus Problem Set',
      description: 'Solve integration and differentiation problems',
      classroomId: '1',
      teacherId: 'teacher1',
      dueDate: new Date('2024-02-15'),
      createdAt: new Date('2024-02-01'),
      tasks: [],
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      description: 'Write a comprehensive lab report on quantum experiments',
      classroomId: '2',
      teacherId: 'teacher1',
      dueDate: new Date('2024-02-20'),
      createdAt: new Date('2024-02-05'),
      tasks: [],
    },
  ],
  currentProject: null,
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  setCurrentProject: (project) => set({ currentProject: project }),
}));

export const useTaskStore = create<TaskState>()((set) => ({
  tasks: [
    // Mock data
    {
      id: '1',
      title: 'Problem 1-5',
      description: 'Solve calculus problems 1 through 5',
      projectId: '1',
      assignedTo: ['student1'],
      status: 'completed',
      dueDate: new Date('2024-02-10'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-09'),
    },
    {
      id: '2',
      title: 'Problem 6-10',
      description: 'Solve calculus problems 6 through 10',
      projectId: '1',
      assignedTo: ['student1'],
      status: 'in-progress',
      dueDate: new Date('2024-02-12'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-08'),
    },
  ],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date() } : t
      ),
    })),
}));

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [
    // Mock data
    {
      id: '1',
      content: 'Welcome to the Math class chat!',
      senderId: 'teacher1',
      senderName: 'Dr. Sarah Johnson',
      senderRole: 'teacher',
      chatType: 'class',
      classroomId: '1',
      timestamp: new Date('2024-02-01T09:00:00'),
    },
    {
      id: '2',
      content: 'Thank you! Looking forward to learning calculus.',
      senderId: 'student1',
      senderName: 'Alex Smith',
      senderRole: 'student',
      chatType: 'class',
      classroomId: '1',
      timestamp: new Date('2024-02-01T09:05:00'),
    },
  ],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  getMessagesForClassroom: (classroomId, chatType) => {
    return get().messages.filter(
      (m) => m.classroomId === classroomId && m.chatType === chatType
    );
  },
}));

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
    }),
    { name: 'theme-storage' }
  )
);