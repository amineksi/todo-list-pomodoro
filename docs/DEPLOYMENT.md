# 🚀 Guide de Déploiement

Ce guide explique comment déployer l'application Pomodoro Task Manager.

## 📋 Prérequis

- Docker et Docker Compose installés
- Git
- (Optionnel) Un serveur avec accès SSH pour déploiement en production

## 🐳 Déploiement avec Docker

### Développement Local

1. **Cloner le repository**
```bash
git clone <your-repo-url>
cd todo-list-pomodoro
```

2. **Configurer les variables d'environnement**
```bash
cp backend/.env.example backend/.env
# Éditer backend/.env si nécessaire
```

3. **Lancer avec Docker Compose**
```bash
docker-compose up -d
```

4. **Accéder à l'application**
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production

1. **Modifier docker-compose.yml pour la production**
   - Utiliser des variables d'environnement sécurisées
   - Configurer un reverse proxy (nginx/traefik)
   - Utiliser PostgreSQL au lieu de SQLite

2. **Build et déploiement**
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Déploiement Manuel

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run build
# Servir le dossier dist avec un serveur web (nginx, apache, etc.)
```

## ☁️ Déploiement Cloud

### Vercel / Netlify (Frontend)

1. Connecter le repository
2. Configurer le build: `npm run build`
3. Définir la variable d'environnement `VITE_API_URL`

### Railway / Render (Backend)

1. Connecter le repository
2. Configurer les variables d'environnement
3. Définir la commande de démarrage: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 🔒 Sécurité en Production

- [ ] Changer `SECRET_KEY` dans `.env`
- [ ] Configurer HTTPS
- [ ] Limiter les origines CORS
- [ ] Utiliser une base de données sécurisée (PostgreSQL)
- [ ] Configurer un firewall
- [ ] Mettre en place des backups réguliers

## 📊 Monitoring

- Health check endpoint: `/health`
- Logs Docker: `docker-compose logs -f`
- Métriques: Intégrer Prometheus/Grafana (optionnel)
