import React from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string; // URL
  bio?: string;
  premiumStatus?: boolean;
  createdAt: number;
  lastActive?: any; // Firestore Timestamp or number
}

export interface Question {
  id: string;
  receiverId: string; // The user who received the question
  senderId?: string | null; // Null if anonymous
  text: string;
  timestamp: number;
  isAnswered: boolean;
  theme?: string; // For visual customization
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string; // The user who answered (same as question receiver)
  questionText: string;
  answerText: string;
  timestamp: number;
  likes: number;
  likedBy?: string[]; // Array of user IDs or device IDs who liked this
  // Denormalized fields for faster feed loading
  authorUsername?: string;
  authorAvatar?: string;
  authorFullName?: string;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}