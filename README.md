# Gogte Kulavruttanta - Family Heritage Portal

A comprehensive web application for managing and exploring the Gogte family heritage, genealogy, and community activities. This platform allows family members to view their family tree, register new members, manage news and events, and explore ancestral connections.

## 🌟 Features

- **Family Tree Visualization**: Interactive family tree (Kulavruksh) with multiple generations
- **Member Registration**: Add new family members with detailed information
- **News & Events Management**: Share community news and upcoming events
- **Multi-Vansh Support**: Separate data management for 14 different family branches (vansh)
- **Role-Based Access Control**: DBA, Master Admin, Admin, and User roles
- **Profile Management**: Update personal information and profile pictures
- **Relationship Explorer**: Discover relationships between family members
- **Multi-language Support**: Interface available in English and Marathi
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Tech Stack

### Frontend
- **React** 18.3.1 - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **D3.js** - Data visualization for family tree
- **i18next** - Internationalization
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **Google APIs** - Integration services

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** account (MongoDB Atlas recommended)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AbhinavVarma01/GogteKulavruttanta.git
cd GogteKulavruttanta
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string

# JWT Secret (use a strong random string)
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Important Environment Variables:**

- `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/databasename`)
- `JWT_SECRET`: A secure random string for JWT token generation (minimum 32 characters recommended)
- `PORT`: Backend server port (default: 5000)

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `frontend` directory (if needed):

```env
VITE_API_URL=http://localhost:5000
```

**Note**: By default, the frontend is configured to connect to `http://localhost:5000`. Update this if your backend runs on a different port.

### 4. Database Setup

#### MongoDB Atlas Setup:

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string and add it to the backend `.env` file

#### Initial Data:

The application requires initial data setup for the family tree. Contact the database administrator for:
- Initial member records
- Vansh (family branch) configurations
- Admin user credentials

### 5. Running the Application

#### Start Backend Server:

```bash
cd backend
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Start Frontend Development Server:

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite's default port)

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 👤 Default Login Credentials

After initial setup, you'll need to create admin users through the database. Contact your database administrator for credentials.

**User Roles:**
- **DBA** - Full database access
- **Master Admin** - Cross-vansh administrative access
- **Admin** - Vansh-specific administrative access
- **User** - Standard family member access

## 📁 Project Structure

```
GogteKulavruttanta/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   └── upload.js        # File upload handling
│   ├── models/
│   │   ├── Event.js         # Event schema
│   │   ├── Media.js         # Media schema
│   │   └── News.js          # News schema
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── events.js        # Event routes
│   │   ├── media.js         # Media routes
│   │   └── news.js          # News routes
│   ├── utils/
│   │   └── memberTransform.js # Family tree utilities
│   ├── server.js            # Main server file
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── parashurama.jpg  # Hero image
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── locales/         # Translation files
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Change default JWT_SECRET** to a strong, unique value
3. **Use MongoDB Atlas IP whitelisting** in production
4. **Enable HTTPS** in production environments
5. **Regularly update dependencies** for security patches

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
```

**Frontend:**
```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
```

## 📦 Building for Production

### Frontend Build:

```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist` directory.

### Backend Deployment:

Ensure all environment variables are properly set in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary to the Gogte Family.

## 👥 Support

For technical support or questions:
- Contact: [Your Contact Information]
- Email: [Your Email]

## 🙏 Acknowledgments

- Parashurama - The Aadipurush (Founding Father) of Chitpavan Brahmins
- Gogte Family Community
- All contributors to this project

---

**Note**: This application contains sensitive family information. Please handle all data with appropriate care and respect for privacy.
