
import React from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  premiumStatus?: boolean;
  createdAt: number;
  lastActive?: number | { toMillis: () => number };
  lastUsernameChange?: number; // Timestamp of the last username modification
}

export interface Question {
  id: string;
  receiverId: string;
  senderId?: string | null;
  text: string;
  timestamp: number;
  isAnswered: boolean;
  theme?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  questionText: string;
  answerText: string;
  timestamp: number;
  likes: number;
  likedBy?: string[];
  authorUsername?: string;
  authorAvatar?: string;
  authorFullName?: string;
  isPublic: boolean;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}
