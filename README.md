# XPARK Games: Career Exploration Platform

![XPARK Logo](client/public/XPLogo.png)

An interactive and engaging educational gaming platform designed to help students explore digital careers. XPARK provides distinct, role-based portals for Students, School Administrators, and Super Administrators, creating a comprehensive management and learning ecosystem.

## Key Features

### 🎓 Student Portal
- **Personalized Dashboard**: At-a-glance view of progress, including game attempts, total score, XP, badges, and certificates earned.
- **Game Library**: Explore, filter, and search a library of career-focused games.
- **My Games Page**: Curated lists of recently played and saved-for-later games.
- **Progress Tracking**: In-depth progress tracking for each game, including level completion and high scores.
- **Game Ratings**: Rate games and view global average ratings to see what's popular.
- **Customizable Profile**: Edit personal details and choose an avatar style.

### 🏫 School Admin Portal
- **Aggregated Dashboard**: A powerful dashboard showing school-wide statistics, including top student performers, total game attempts, and most popular games.
- **Student Management**:
    - Invite students individually with customizable email templates.
    - Bulk-invite students via CSV upload.
    - View and manage registered vs. pending students.
    - Resend invitation reminders to pending students.
- **Game Progress Insights**: A dedicated page to view aggregated progress and ratings for all games across the entire school.

### ⚙️ Super Admin Portal
- **School Management**: Full CRUD (Create, Read, Update, Delete) functionality for managing schools on the platform.
- **Admin Management**: Create, view, and delete School Administrator accounts.
- **Invitation Control**: Resend activation invites to administrators who haven't yet joined.

### ✨ General Features
- **Secure Authentication**: Robust token-based (JWT) authentication with access and refresh tokens.
- **Role-Based Access Control**: Protected routes and features tailored to each user role (Student, School Admin, Super Admin).
- **Theme Support**: Seamless switching between Dark and Light themes.
- **Centralized Logging**: Comprehensive frontend and backend logging for effective debugging and monitoring.

---

## 🚀 Tech Stack

| Area      | Technology                                                                                                  |
| :-------- | :---------------------------------------------------------------------------------------------------------- |
| **Frontend**  | **React**, **Vite**, **Tailwind CSS**, React Router, Lucide Icons                                           |
| **Backend**   | **Node.js**, **Express.js**, **MongoDB**, Mongoose                                                          |
| **Authentication** | JSON Web Tokens (JWT), bcrypt.js                                                                        |
| **File Handling** | Multer for file uploads, `csv-parser` for CSV processing                                                  |
| **Email**     | Nodemailer for sending transactional emails (invitations, password resets).                                 |
| **Logging**   | **Pino** (Backend) for structured, high-performance logging.                                                |
| **Security**  | Helmet, CORS, password hashing, environment variables.                                                    |

---

## 🔧 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a connection string for a cloud instance (e.g., MongoDB Atlas).

### 1. Clone the Repository

```bash
git clone https://github.com/aswin09032006/x-park
```

### 2. Backend Setup

Navigate to the backend directory and set up the environment.

```bash
cd server
npm install
```

Create a `.env` file in the `backend` directory and add the following environment variables. Replace the placeholder values with your own.

**.env (Backend)**
```env
# Server Configuration
PORT=5000
ENVIRONMENT=development # or 'production'

# Database
MONGO_URI=mongodb://127.0.0.1:27017/xpark_db

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Default Admin Users (for initial seeding)
SUPERADMIN_EMAIL=superadmin@xpark.com
SUPERADMIN_PASSWORD=superadminpassword
ADMIN_EMAIL=admin@xpark.com
ADMIN_PASSWORD=adminpassword

# Email Configuration (using Nodemailer)
EMAIL_FROM="XPARK Games <noreply@xparkgames.com>"
SUPPORT_EMAIL=support@yourdomain.com
FRONTEND_URL_EMAIL=http://localhost:5173

# Production Email SMTP (Example for Gmail)
PROD_EMAIL_HOST=smtp.gmail.com
PROD_EMAIL_PORT=465
PROD_EMAIL_USER=your_email@gmail.com
PROD_EMAIL_PASS=your_app_password
```

### 3. Frontend Setup

Navigate to the frontend directory in a new terminal window.

```bash
cd client
npm install
```

Create a `.env` file in the `frontend` directory and add the following:

**.env (Frontend)**
```env
# URL of your running backend server
VITE_BACKEND_LOCAL_URL=http://localhost:5000
```

### 4. Running the Application

1.  **Start the Backend Server**:
    ```bash
    # In the /server directory
    node server
    ```
    The backend API will be running on the port specified in your `.env` file (e.g., `http://localhost:5000`). The initial database seeding will run automatically.

2.  **Start the Frontend Development Server**:
    ```bash
    # In the /client directory
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

You can now access the application in your browser!

---

## 📜 Available Scripts

### Backend (`/server`)

-   `npm start`: Starts the server in production mode.
-   `npm run dev`: Starts the server in development mode with `nodemon` for auto-reloading.
-   `npm run seeder`: Seeds the database with initial school and admin data. **Note**: The server runs a seed process on its first start automatically.

### Frontend (`/client`)

-   `npm run dev`: Starts the Vite development server.
-   `npm run build`: Builds the production-ready application.
-   `npm run preview`: Previews the production build locally.

## 🚫 Contributing

This project is currently in **production** and not open for public contributions.  
For inquiries, feature requests, or collaboration opportunities, please contact the development team directly.

## 📜 License

This project is **proprietary and not open-source**.  
All rights reserved. Unauthorized copying, modification, or distribution of this software is strictly prohibited.
