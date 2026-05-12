# 🎯 Emoji Explanation Challenge Platform

A time-bound web application where users explain technical concepts using emojis and a short explanation.

Last updated: May 7, 2026.

---

## 📌 Description

The Emoji Explanation Challenge Platform is an interactive web app designed to test creativity and technical understanding.  
Participants interpret given technical terms using emojis (max 5) along with a one-line explanation within a fixed time limit.

---

## 🚀 Features

- 🔐 Login using USN (no password required)
- ⏱️ 60-second timer per question
- 😀 Emoji-based answers (max 5 emojis)
- ✍️ One-line explanation input
- ⚡ Auto-submit when time runs out
- 🔄 Questions displayed one by one
- 🚫 Prevent multiple attempts
- ☁️ Data stored in Firebase Firestore
- 🧑‍💻 Admin panel to view responses

---

## 🧠 How It Works

1. User enters their USN to log in  
2. Reads the challenge rules  
3. Starts the challenge  
4. Each question appears with a 60-second timer  
5. User submits:
   - Emojis (max 5)
   - One-line explanation  
6. If time ends → answer auto-submitted  
7. System moves to next question  
8. After completion → responses are stored in database  

---

## 🛠️ Tech Stack

- ⚛️ React (Frontend)
- 🔥 Firebase Firestore (Database)
- 🌐 Firebase Hosting
- 🧩 React Router DOM

---

