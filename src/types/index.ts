export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  role: string;
  xp: number;
  level: string;
  current_streak: number;
  longest_streak: number;
  last_studied_at: string | null;
  weekly_goal_hrs: number;
  daily_goal_hrs?: number;
  subjects: Subject[];
  badges: string[];
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  subject_name: string;
  subject_color: string;
  duration_mins: number;
  focus_rating: number;
  mood: string;
  note: string;
  xp_earned: number;
  started_at: string;
  completed_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  created_by: string;
  member_ids: string[];
  is_private: boolean;
  invite_code: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Included via join for display
  users?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

export interface SyllabusTopic {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  dueDate?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  weeklyGoalHrs: number;
  examName?: string;
  examDate?: string;
  examReminderDate?: string;
  syllabus?: SyllabusTopic[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  icon: string;
}

export interface TimerState {
  subjectId: string | null;
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  longBreakAfter: number;
  autoStart: boolean;
  sound: string;
  volume: number;
  timerType: 'Pomodoro' | 'Stopwatch';
  ambientSound: string;
  ambientVolume: number;
}

export interface Exam {
  examName: string;
  examDate: string;
}
