// services/firebase/collections.js
// src/services/firebase/collections.js

// Nomi delle collezioni Firestore
export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  PROJECTS: 'projects',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  TRASH: 'trash'
};

// Struttura dati attesa per ogni collezione
export const DATA_MODELS = {
  USER: {
    id: '',
    email: '',
    name: '',
    role: 'dipendente', // 'admin' o 'dipendente'
    department: '',
    avatar: '',
    isActive: true,
    createdAt: null,
    updatedAt: null,
    lastLogin: null
  },
  
  TASK: {
    id: '',
    title: '',
    description: '',
    assignedTo: '', // userId
    assignedBy: '', // userId dell'assegnatore
    project: '',
    client: '',
    status: 'assegnato', // 'assegnato', 'in corso', 'completato', 'bloccato'
    priority: 'media', // 'bassa', 'media', 'alta'
    complexity: 'media', // 'bassa', 'media', 'alta', 'molto_alta'
    dueDate: null,
    hoursEstimated: 0,
    hoursSpent: 0,
    qualityScore: 0,
    notes: '',
    technologies: [],
    createdAt: null,
    updatedAt: null,
    completedAt: null,
    approvedBy: '' // userId dell'approvatore
  },
  
  ACTIVITY: {
    id: '',
    userId: '',
    userName: '',
    userEmail: '',
    userRole: '',
    type: 'task_completed', // 'task_completed', 'task_created', 'task_updated', 'user_action', 'system_event'
    title: '',
    description: '',
    taskId: '',
    taskTitle: '',
    project: '',
    client: '',
    hoursSpent: 0,
    qualityScore: 0,
    complexity: 'media',
    status: 'completed', // 'completed', 'approved', 'rejected', 'in_review'
    technologies: [],
    department: '',
    timestamp: null,
    metadata: {}
  }
};