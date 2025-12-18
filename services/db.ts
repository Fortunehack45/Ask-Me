
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
  arrayRemove,
  Timestamp,
  deleteDoc
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
  return snap.docs[0].data().email as string;
};

export const createUserProfile = async (user: UserProfile) => {
  const usernameLower = user.username.toLowerCase();
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
    await updateDoc(userRef, {
      lastActive: serverTimestamp()
    });
  } catch (e) {
    console.warn("Last active update skipped", e);
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
  const q = query(
    collection(db, "questions"), 
    where("receiverId", "==", uid)
  );
  
  const snap = await getDocs(q);
  const questions = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Question))
    .filter(q => !q.isAnswered); 
  
  return questions.sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteQuestion = async (id: string) => {
  const qRef = doc(db, "questions", id);
  await deleteDoc(qRef);
};

// Answer Services
export const publishAnswer = async (question: Question, answerText: string, userProfile: UserProfile | null, isPublic: boolean = false) => {
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
    authorFullName: userProfile?.fullName || '',
    isPublic
  });

  const qRef = doc(db, "questions", question.id);
  await updateDoc(qRef, { isAnswered: true });
};

export const deleteAnswer = async (answerId: string) => {
  const aRef = doc(db, "answers", answerId);
  await deleteDoc(aRef);
};

export const updateAnswerVisibility = async (answerId: string, isPublic: boolean) => {
  const aRef = doc(db, "answers", answerId);
  await updateDoc(aRef, { isPublic });
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
      return false; 
    } else {
      await updateDoc(answerRef, {
        likedBy: arrayUnion(userId),
        likes: increment(1)
      });
      return true; 
    }
  }
  return false;
};

export const getUserFeed = async (uid: string): Promise<Answer[]> => {
  const q = query(
    collection(db, "answers"),
    where("userId", "==", uid)
  );
  
  const snap = await getDocs(q);
  const answers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Answer));
  return answers.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
};

export const getUserStats = async (uid: string) => {
  const q = query(collection(db, "answers"), where("userId", "==", uid));
  try {
    const snap = await getDocs(q);
    const totalLikes = snap.docs.reduce((acc, doc) => acc + (doc.data().likes || 0), 0);
    return {
      answers: snap.size,
      likes: totalLikes
    };
  } catch (error) {
    return { answers: 0, likes: 0 };
  }
};

export const getGlobalFeed = async (): Promise<Answer[]> => {
  try {
    const q = query(
        collection(db, "answers"),
        where("isPublic", "==", true),
        orderBy("timestamp", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Answer));
  } catch (e) {
      const q = query(collection(db, "answers"), where("isPublic", "==", true), limit(50));
      const snap = await getDocs(q);
      const answers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Answer));
      return answers.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }
};

// Admin Services
export const getAdminAnalytics = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"), limit(1000));
        const snap = await getDocs(q);
        
        return snap.docs.map(doc => {
            const data = doc.data();
            let lastActiveVal = 0;
            
            // Check specifically for Firestore Timestamp instances
            if (data.lastActive instanceof Timestamp) {
                lastActiveVal = data.lastActive.toMillis();
            } else if (typeof data.lastActive === 'number') {
                lastActiveVal = data.lastActive;
            } else if (data.lastActive && typeof data.lastActive.toMillis === 'function') {
                lastActiveVal = data.lastActive.toMillis();
            }

            return {
                ...data,
                uid: doc.id,
                createdAt: data.createdAt || 0,
                lastActive: lastActiveVal
            } as UserProfile;
        });
    } catch (e) {
        console.error("Admin analytics error:", e);
        return [];
    }
};