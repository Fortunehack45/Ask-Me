import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, Question, Answer } from "../types";

// User Services
export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const q = query(
    collection(db, "users"), 
    where("username", "==", username.toLowerCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

export const getEmailByUsername = async (username: string): Promise<string | null> => {
  const q = query(
    collection(db, "users"), 
    where("username", "==", username.toLowerCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data().email;
};

export const createUserProfile = async (user: UserProfile) => {
  const usernameLower = user.username.toLowerCase();

  // Double-check uniqueness
  const taken = await isUsernameTaken(usernameLower);
  if (taken) {
    throw new Error("Username is already taken");
  }

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    ...user,
    username: usernameLower,
    lastActive: serverTimestamp()
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const updateUserLastActive = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    updateDoc(userRef, {
      lastActive: serverTimestamp()
    });
  } catch (e) {
    console.warn("Failed to update last active", e);
  }
};

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

export const saveFCMToken = async (uid: string, token: string) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    fcmTokens: arrayUnion(token),
    notificationsEnabled: true,
    lastTokenUpdate: serverTimestamp()
  });
};

// Question Services
export const sendQuestion = async (receiverId: string, text: string, theme: string = 'default') => {
  await addDoc(collection(db, "questions"), {
    receiverId,
    text,
    timestamp: Date.now(),
    isAnswered: false,
    senderId: null,
    theme: theme 
  });
};

export const getInboxQuestions = async (uid: string): Promise<Question[]> => {
  // Query ONLY by receiverId to avoid missing index errors.
  const q = query(
    collection(db, "questions"), 
    where("receiverId", "==", uid)
  );
  
  const snap = await getDocs(q);
  const questions = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Question))
    .filter(q => !q.isAnswered); // Client-side filter
  
  return questions.sort((a, b) => b.timestamp - a.timestamp);
};

// Answer Services
export const publishAnswer = async (question: Question, answerText: string, userProfile: UserProfile | null) => {
  await addDoc(collection(db, "answers"), {
    questionId: question.id,
    userId: question.receiverId,
    questionText: question.text,
    answerText,
    timestamp: Date.now(),
    likes: 0,
    likedBy: [],
    authorUsername: userProfile?.username || '',
    authorAvatar: userProfile?.avatar || '',
    authorFullName: userProfile?.fullName || ''
  });

  const qRef = doc(db, "questions", question.id);
  await updateDoc(qRef, { isAnswered: true });
};

export const toggleAnswerLike = async (answerId: string, userId: string): Promise<boolean> => {
  const answerRef = doc(db, "answers", answerId);
  const answerSnap = await getDoc(answerRef);

  if (answerSnap.exists()) {
    const data = answerSnap.data();
    const likedBy = data.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      await updateDoc(answerRef, {
        likedBy: arrayRemove(userId),
        likes: increment(-1)
      });
      return false; // Liked removed
    } else {
      await updateDoc(answerRef, {
        likedBy: arrayUnion(userId),
        likes: increment(1)
      });
      return true; // Liked added
    }
  }
  return false;
};

export const getUserFeed = async (uid: string): Promise<Answer[]> => {
  // Query only by UserID. Simple query = No Index Required.
  const q = query(
    collection(db, "answers"),
    where("userId", "==", uid)
  );
  
  const snap = await getDocs(q);
  const answers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Answer));
  
  // Client-side sort
  return answers.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
};

// Stats Service - Pure Client Side to avoid 'failed-precondition' errors
export const getUserStats = async (uid: string) => {
  const answersRef = collection(db, "answers");
  const q = query(answersRef, where("userId", "==", uid));

  try {
    // We fetch the documents directly. 
    // This bypasses the need for complex aggregation indexes which are causing errors.
    const snap = await getDocs(q);
    
    // Calculate client-side
    const totalLikes = snap.docs.reduce((acc, doc) => acc + (doc.data().likes || 0), 0);
    
    return {
      answers: snap.size,
      likes: totalLikes
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { answers: 0, likes: 0 };
  }
};

export const getGlobalFeed = async (): Promise<Answer[]> => {
  try {
    const q = query(
        collection(db, "answers"),
        orderBy("timestamp", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Answer));
  } catch (e) {
      // Fallback if index missing
      const q = query(collection(db, "answers"), limit(50));
      const snap = await getDocs(q);
      const answers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Answer));
      return answers.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }
};

// Admin Services
export const getAdminStats = async () => {
  try {
    const usersColl = collection(db, "users");
    const questionsColl = collection(db, "questions");
    const answersColl = collection(db, "answers");
    
    // We use getDocs instead of getCountFromServer to be safe against index errors for now,
    // though count() usually works with simple collections.
    const [uSnap, qSnap, aSnap] = await Promise.all([
        getDocs(query(usersColl, limit(1000))), 
        getDocs(query(questionsColl, limit(1000))),
        getDocs(query(answersColl, limit(1000)))
    ]);

    return {
        totalUsers: uSnap.size,
        activeUsers: 0, 
        totalQuestions: qSnap.size,
        totalAnswers: aSnap.size
    };
  } catch (e) {
      console.error("Admin stats failed", e);
      return { totalUsers: 0, activeUsers: 0, totalQuestions: 0, totalAnswers: 0 };
  }
};