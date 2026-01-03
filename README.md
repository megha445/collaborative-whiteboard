# 🎨 Real-Time Collaborative Whiteboard

A full-stack real-time collaborative whiteboard application where multiple users can draw together on a shared canvas with live cursor tracking. Built with MERN stack and Socket.io.

![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-brightgreen)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black)

---

## ✨ Features

- 🔐 **Passwordless Authentication** - Login with OTP sent to email
- 🏠 **Room Management** - Create public/private rooms with passwords
- 🎨 **Real-Time Drawing** - Collaborate with multiple users simultaneously
- 👥 **Live Cursor Tracking** - See other users' cursors with their names
- 🖌️ **Drawing Tools** - Pen (1-20px) and Eraser (1-50px) with 8 colors
- 💾 **Download Canvas** - Save your work as PNG image
- 🗑️ **Clear Canvas** - Reset board for all users
- 🔍 **Search & Sort** - Find rooms easily
- 📊 **Live User Count** - See who's online in each room

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Socket.io Client
- Axios
- React Router
- Canvas API

**Backend:**
- Node.js
- Express.js
- Socket.io
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Nodemailer

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v14 or higher
- MongoDB (local or MongoDB Atlas)
- Gmail account (for OTP emails)

### Step 1: Clone Repository
```bash
git clone https://github.com/megha445/collaborative-whiteboard.git
cd collaborative-whiteboard
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=your_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173
```

**Gmail App Password Setup:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Search for **App Passwords**
4. Generate new password for "Mail"
5. Copy the 16-character password to `EMAIL_PASS`

Start backend:
```bash
npm run dev
```

### Step 3: Frontend Setup

Open new terminal:
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

### Step 4: Open Application
```
http://localhost:5173
```

---

## 📖 How to Use

1. **Sign Up** - Enter name and email
2. **Login** - Receive OTP in email and verify
3. **Create Room** - Choose public or private (with password)
4. **Join Room** - Click "Join Room" on any room card
5. **Draw** - Select pen/eraser, adjust size, choose color, and start drawing
6. **Collaborate** - See other users' cursors and drawings in real-time
7. **Download** - Save your canvas as PNG
8. **Delete** - Room creators can delete their rooms

---

## 🧪 Testing

### Test with Two Browsers
1. Open Chrome: `http://localhost:5173`
2. Open Firefox/Incognito: `http://localhost:5173`
3. Sign up with different emails
4. Login both users
5. Create/join same room
6. Draw and see real-time collaboration!

---

## 📂 Project Structure
```
collaborative-whiteboard/
├── backend/
│   ├── config/          # Database connection
│   ├── models/          # User & Room schemas
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # JWT authentication
│   ├── socket/          # Socket.io handlers
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth & Socket context
│   │   ├── services/    # API & Socket setup
│   │   └── App.jsx      # Main app
│   └── vite.config.js
│
└── README.md
```

---

## 🔌 API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Register user
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP & login

**Rooms (Protected):**
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join private room
- `DELETE /api/rooms/:roomId` - Delete room

---

## 🔧 Environment Variables

### Backend `.env`
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/whiteboard |
| JWT_SECRET | Secret key for JWT | your_secret_key |
| EMAIL_USER | Gmail address | your_email@gmail.com |
| EMAIL_PASS | Gmail app password | your_app_password |
| CLIENT_URL | Frontend URL | http://localhost:5173 |

### Frontend `.env`
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |
| VITE_SOCKET_URL | Socket.io URL | http://localhost:5000 |

---

## 🐛 Troubleshooting

**Problem: OTP not received**
- Check spam/junk folder
- Verify Gmail app password is correct
- Ensure 2-Step Verification is enabled

**Problem: Socket connection failed**
- Check if backend is running on port 5000
- Verify `VITE_SOCKET_URL` in frontend `.env`

**Problem: MongoDB connection error**
- Ensure MongoDB is running
- Check `MONGO_URI` is correct
- For Atlas: Whitelist your IP address

**Problem: Cursor lag**
- Cursor updates at 60fps (optimized)
- Check internet connection

---

## 🙏 Acknowledgments

- Socket.io for real-time communication
- MongoDB for database
- React team for amazing UI library
- TailwindCSS for styling

---

## 👨‍💻 Author

**Megha shyam**

- GitHub: [@megha445](https://github.com/megha445)
- Email: vattamvenkatasaimeghashyamredd@gmail.com

---

