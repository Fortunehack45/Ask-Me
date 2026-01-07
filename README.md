# Ask Me — Anonymous Q&A Platform

Ask Me is a premium, high-performance anonymous Q&A platform (NGL Clone) designed for seamless social sharing and engagement. It allows users to create professional profiles, receive anonymous questions, and publish stylishly rendered answers directly to their feed or social media stories.

## ✨ Key Features

- **Anonymous Messaging**: Secure messaging system that preserves sender anonymity.
- **Dynamic Story Generator**: Instantly generate 9:16 high-resolution images for Instagram, Snapchat, and TikTok stories.
- **Stylish Theming**: Choose from a variety of aesthetic gradients (Fiery, Ocean, Jungle, Love, Midnight) or a sleek Noir default.
- **Billion-Dollar UI/UX**: A meticulously crafted interface featuring glassmorphism, fluid animations with Framer Motion, and full Light/Dark mode responsiveness.
- **Real-time Analytics**: Built-in dashboard to track your engagement, likes, and question volume.
- **Admin Command Center**: Advanced management tools for platform administrators to monitor user growth and activity.
- **Push Notifications**: Integrated Firebase Cloud Messaging (FCM) support to notify users of new questions.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS (Vite-optimized).
- **Backend**: Firebase (Authentication, Firestore, Analytics, Cloud Messaging).
- **Imaging**: `html-to-image` for on-the-fly social media asset generation.
- **Visuals**: Lucide React for iconography, Recharts for analytics visualization.
- **Hosting**: Optimized for Vercel/Netlify with deep-link routing support.

## 🚀 Getting Started

1. **Prerequisites**: Ensure you have a Firebase project set up.
2. **Installation**:
   ```bash
   npm install
   ```
3. **Environment**: Update `firebase.ts` with your credentials.
4. **Run Dev**:
   ```bash
   npm run dev
   ```

## 📐 Architecture & Layout

Ask Me uses an adaptive layout that "fills the screen" to ensure professional density on all devices. 
- **Desktop**: Persistent glass-blurred sidebar for navigation and user context.
- **Mobile**: Floating bottom navigation bar and a centered branding header.
- **Contrast**: Intelligent color management (Zinc-900 on Light / White on Dark) for maximum accessibility and readability.

---
Built by [Esho Fortune Adebayo](https://wa.me/2349167689200)