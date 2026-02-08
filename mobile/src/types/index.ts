export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Goal {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  targetDate?: string;
  priority?: string;
  completed: boolean;
  imageUri?: string;
}

export interface Board {
  id: string;
  title: string;
  goalIds: string[];
  coverImageUri?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  goalId?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  goalId?: string;
}
