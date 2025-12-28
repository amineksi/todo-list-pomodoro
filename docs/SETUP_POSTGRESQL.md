# 🐘 Configuration PostgreSQL Locale

Ce guide explique comment configurer PostgreSQL sur votre ordinateur local pour le développement.

## 📦 Installation de PostgreSQL

### Sur Ubuntu/WSL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Sur Windows

Téléchargez et installez depuis : https://www.postgresql.org/download/windows/

### Sur macOS

```bash
brew install postgresql
brew services start postgresql
```

## 🔧 Configuration Initiale

### 1. Créer un utilisateur et une base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL :
CREATE USER pomodoro_user WITH PASSWORD 'pomodoro_password';
CREATE DATABASE pomodoro_db OWNER pomodoro_user;
GRANT ALL PRIVILEGES ON DATABASE pomodoro_db TO pomodoro_user;
\q
```

### 2. Configurer l'application

Créez un fichier `.env` dans le dossier `backend/` :

```env
DATABASE_URL=postgresql://pomodoro_user:pomodoro_password@localhost:5432/pomodoro_db
SECRET_KEY=your-secret-key-here
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 3. Installer le driver PostgreSQL

```bash
cd backend
pip install psycopg2-binary
```

Ou si vous utilisez le venv :
```bash
cd backend
source venv/bin/activate
pip install psycopg2-binary
```

## 🚀 Utilisation

### Démarrer le backend

Le backend utilisera automatiquement PostgreSQL si `DATABASE_URL` pointe vers PostgreSQL.

```bash
cd backend
python3 run.py
```

Les tables seront créées automatiquement au premier démarrage.

## 🔄 Migration vers la Production

### Option 1 : Même configuration PostgreSQL

Si votre serveur de production utilise PostgreSQL avec la même structure :

1. **Exportez les données depuis votre DB locale** :
   ```bash
   pg_dump -U pomodoro_user -d pomodoro_db > backup.sql
   ```

2. **Importez dans la DB de production** :
   ```bash
   psql -U production_user -d production_db < backup.sql
   ```

3. **Mettez à jour DATABASE_URL** dans votre configuration de production

### Option 2 : Service managé (Recommandé)

Utilisez un service managé comme :
- **Heroku Postgres**
- **Railway PostgreSQL**
- **Supabase**
- **AWS RDS**
- **Google Cloud SQL**

Ces services gèrent automatiquement :
- Les sauvegardes
- La réplication
- La scalabilité
- La sécurité

## 🔐 Sécurité

### En développement local

- Utilisez des mots de passe simples (c'est OK pour le dev local)
- La DB est uniquement accessible depuis votre machine

### En production

- ✅ Utilisez des mots de passe forts
- ✅ Limitez l'accès réseau (firewall)
- ✅ Utilisez SSL/TLS pour les connexions
- ✅ Activez les sauvegardes automatiques
- ✅ Ne commitez jamais les credentials dans Git

## 🛠️ Commandes Utiles

### Se connecter à PostgreSQL

```bash
psql -U pomodoro_user -d pomodoro_db
```

### Lister les bases de données

```sql
\l
```

### Lister les tables

```sql
\dt
```

### Voir la structure d'une table

```sql
\d users
\d tasks
```

### Réinitialiser la base de données

```sql
-- Dans psql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Puis redémarrez le backend - les tables seront recréées.

## 🔄 Basculer entre SQLite et PostgreSQL

### Pour utiliser SQLite (simple, pour tester rapidement)

Dans `backend/.env` :
```env
DATABASE_URL=sqlite:///./pomodoro_tasks.db
```

### Pour utiliser PostgreSQL (recommandé pour le développement)

Dans `backend/.env` :
```env
DATABASE_URL=postgresql://pomodoro_user:pomodoro_password@localhost:5432/pomodoro_db
```

## 📝 Notes

- **SQLite** : Parfait pour tester rapidement, pas besoin d'installation
- **PostgreSQL local** : Meilleur pour développer avec la même stack que la production
- **PostgreSQL en production** : Utilisez un service managé pour la facilité et la sécurité

## 🐛 Dépannage

### Erreur : "psycopg2 not found"

```bash
pip install psycopg2-binary
```

### Erreur : "connection refused"

Vérifiez que PostgreSQL est démarré :
```bash
sudo systemctl status postgresql  # Linux
brew services list  # macOS
```

### Erreur : "password authentication failed"

Vérifiez le fichier `pg_hba.conf` et assurez-vous que l'authentification par mot de passe est activée.

