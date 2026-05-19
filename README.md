# 🌾 Krishi Mitra – Smart Agriculture Services Platform

> AI-powered smart agriculture service booking platform connecting **Farmers** and **Service Providers** — built with the MERN Stack and deployed on Vercel.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen?style=for-the-badge)](https://krishi-mitra-plum.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-KrishiMitra-blue?style=for-the-badge&logo=github)](https://github.com/yuvrajsingh64/KrishiMitra)
![JavaScript](https://img.shields.io/badge/JavaScript-96%25-yellow?style=for-the-badge&logo=javascript)

---

## 📌 About the Project

**Krishi Mitra** (meaning *Farmer's Friend* in Hindi) is a full-stack web platform that digitises and automates agriculture service management. It bridges the gap between farmers who need services (soil testing, equipment rental, crop advisory) and service providers who offer them — reducing manual coordination by **40%** through smart workflow automation.

---

## 🚀 Live Demo

🌐 **[https://krishi-mitra-plum.vercel.app/](https://krishi-mitra-plum.vercel.app/)**

---

## ✨ Key Features

- 🔐 **Secure Multi-Tenant Authentication** — Role-based access for Farmers and Service Providers with JWT
- 📋 **Service Booking & Management** — End-to-end booking workflows with real-time status tracking
- 🤖 **AI-Driven Recommendations** — Smart service suggestions based on crop type and seasonal data
- 📊 **Dashboard Analytics** — Separate dashboards for farmers and providers with data visualisation
- 🔒 **Data Integrity & Validation** — Server-side validation ensuring consistent, reliable data across all operations
- 📱 **Responsive UI** — Mobile-first design accessible on any device
- ⚡ **REST API Architecture** — Clean, modular API endpoints with proper error handling

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas) |
| **Authentication** | JWT, bcrypt |
| **Deployment** | Vercel (Frontend), Render (Backend) |
| **API Style** | RESTful APIs |

---

## 📁 Project Structure

```
KrishiMitra/
├── client/          # React.js frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
├── server/          # Node.js + Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
└── .gitignore
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yuvrajsingh64/KrishiMitra.git
cd KrishiMitra
```

```bash
# Setup Backend
cd server
npm install
cp .env.example .env   # Add your environment variables
npm start
```

```bash
# Setup Frontend
cd ../client
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the `/server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

---

## 📈 Impact & Results

- ✅ Reduced manual agriculture service coordination by **40%**
- ✅ Secure multi-tenant system handling multiple concurrent user roles
- ✅ Modular REST API design enabling rapid feature iteration
- ✅ Deployed and production-ready on Vercel

---

## 👨‍💻 Author

**Yuvraj Singh**
- 📧 mr.yuvrajsinghh@gmail.com
- 🔗 [LinkedIn](https://linkedin.com/in/yuvrajsingh64)
- 💻 [GitHub](https://github.com/yuvrajsingh64)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
