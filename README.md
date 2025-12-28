# 🍅 Pomodoro Task Manager

**Full-stack productivity app combining task management with Pomodoro technique**

A modern productivity tool that helps users manage tasks while using the Pomodoro technique for focused work sessions. Built with Next.js frontend and FastAPI backend.

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Protected routes and user-specific data
- Secure password hashing with bcrypt

### 🕒 Pomodoro Timer
- 25-minute work sessions with 5-minute breaks
- Long break (15min) after 4 pomodoros
- Visual timer with progress indicators
- Session tracking per task

### 📋 Task Management
- Create, edit, delete tasks
- Priority levels (High, Medium, Low)
- Status tracking (Todo → In Progress → Done)
- Due dates support
- User-specific task isolation

### 📊 Productivity Dashboard
- Daily/weekly pomodoro statistics
- Task completion rates
- Time tracking per task
- Productivity trends
- User-specific statistics

### 🐳 DevOps Ready
- Docker containerization
- Automated testing
- CI/CD pipeline
- Production deployment ready

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance async web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Database (used for both development and production)
- **Pydantic** - Data validation

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - API client

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Docker Compose** - Multi-container orchestration

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd todo-list-pomodoro

# Start with Docker Compose (includes PostgreSQL container)
docker-compose up -d

# If port 5432 is already in use (local PostgreSQL), use port 5433:
# The PostgreSQL container will use port 5433 on your host
# Update DATABASE_URL in backend/.env if needed

# Or use local PostgreSQL instead:
docker-compose -f docker-compose.local-postgres.yml up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Prerequisites
PostgreSQL must be installed and running. See [PostgreSQL Setup Guide](./docs/SETUP_POSTGRESQL.md) for installation instructions.

#### Setup PostgreSQL (First time only)
```bash
# Run the setup script (Ubuntu/WSL)
make setup-postgres

# Or manually:
sudo -u postgres psql
CREATE USER pomodoro_user WITH PASSWORD 'pomodoro_password';
CREATE DATABASE pomodoro_db OWNER pomodoro_user;
GRANT ALL PRIVILEGES ON DATABASE pomodoro_db TO pomodoro_user;
\q
```

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with PostgreSQL connection
echo "DATABASE_URL=postgresql://pomodoro_user:pomodoro_password@localhost:5432/pomodoro_db" > .env

python run.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will automatically connect to `http://localhost:8000/api/v1`.

### API Documentation
Once the backend is running, visit: http://localhost:8000/docs

## 📁 Project Structure
```
todo-list-pomodoro/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── core/           # Configuration
│   └── tests/              # Backend tests
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   └── lib/                # Utilities and API client
├── docs/                   # Documentation
│   ├── API.md            # API documentation
│   └── DEPLOYMENT.md     # Deployment guide
├── docker-compose.yml     # Docker Compose config
└── .github/workflows/     # CI/CD pipelines
```

## ✅ Project Status

- [x] Backend API structure
- [x] Task CRUD operations
- [x] Pomodoro timer logic
- [x] Statistics endpoint
- [x] Next.js frontend with TypeScript
- [x] Docker setup (Dockerfile + docker-compose)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Backend unit tests
- [x] Complete documentation
- [x] **User authentication system (JWT)**
- [x] **Protected routes and user-specific data**

## 🐛 Troubleshooting

### Issue: "Network Error" or "Cannot connect to backend"

1. **Check containers are running**:
   ```bash
   docker-compose ps
   ```
   Both services (backend and frontend) should be "Up"

2. **Check logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Test backend connection**:
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy","service":"pomodoro-task-manager"}`

4. **Rebuild images**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Issue: Stats not loading

- Check browser console (F12) for errors
- Verify backend responds: `curl http://localhost:8000/api/v1/stats/dashboard`
- Check CORS in backend logs

### Issue: Task creation not working

- Check backend logs for exact error
- Verify database is accessible
- Test API directly: `curl -X POST http://localhost:8000/api/v1/tasks -H "Content-Type: application/json" -d '{"title":"Test"}'`

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Production Guide](./docs/PRODUCTION.md)
- [PostgreSQL Setup Guide](./docs/SETUP_POSTGRESQL.md)
- [Authentication Guide](./docs/AUTHENTICATION.md)

## 📝 License

See [LICENSE](./LICENSE) file for details.

---

Built with ❤️ for productivity enthusiasts