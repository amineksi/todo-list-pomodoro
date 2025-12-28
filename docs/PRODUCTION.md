# 🚀 Guide de Déploiement en Production

Ce guide explique comment déployer l'application Pomodoro Task Manager en production.

## 📋 Prérequis

- Docker et Docker Compose installés
- Un domaine (optionnel mais recommandé)
- Un certificat SSL (pour HTTPS)

## 🗄️ Base de Données

### Option 1 : PostgreSQL (Recommandé pour la production)

PostgreSQL est recommandé pour la production car :
- Meilleure performance avec plusieurs utilisateurs
- Support des transactions ACID
- Meilleure scalabilité
- Support natif des connexions simultanées

**Configuration :**

1. Utilisez `docker-compose.prod.yml` :
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. Configurez les variables d'environnement dans `.env` :
   ```env
   DATABASE_URL=postgresql://user:password@postgres:5432/pomodoro_db
   SECRET_KEY=your-very-secure-secret-key-here
   BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

### Option 2 : SQLite (Développement uniquement)

SQLite est adapté pour le développement mais **non recommandé pour la production** car :
- Limité à un seul writer à la fois
- Pas de support réseau natif
- Performance limitée avec plusieurs utilisateurs

## 🔐 Sécurité

### Variables d'environnement critiques

1. **SECRET_KEY** : Changez la clé secrète par défaut !
   ```env
   SECRET_KEY=generate-a-random-secret-key-here
   ```
   Générez une clé sécurisée :
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **DATABASE_URL** : Utilisez des identifiants forts
   ```env
   DATABASE_URL=postgresql://strong_user:strong_password@host:5432/dbname
   ```

3. **BACKEND_CORS_ORIGINS** : Limitez les origines autorisées
   ```env
   BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

## 🌐 Déploiement

### Avec Docker Compose (Production)

1. **Copiez le fichier de production** :
   ```bash
   cp docker-compose.prod.yml docker-compose.yml
   ```

2. **Créez un fichier `.env`** avec vos configurations :
   ```env
   DATABASE_URL=postgresql://pomodoro_user:strong_password@postgres:5432/pomodoro_db
   SECRET_KEY=your-secret-key-here
   BACKEND_CORS_ORIGINS=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   ```

3. **Lancez les services** :
   ```bash
   docker-compose up -d
   ```

4. **Vérifiez les logs** :
   ```bash
   docker-compose logs -f
   ```

### Avec un service cloud (Heroku, Railway, etc.)

1. Configurez les variables d'environnement dans votre plateforme
2. Utilisez une base de données PostgreSQL managée (Heroku Postgres, Railway PostgreSQL, etc.)
3. Déployez le backend et le frontend séparément

## 🔄 Migration de SQLite vers PostgreSQL

Si vous avez des données en SQLite et voulez migrer vers PostgreSQL :

1. Exportez les données depuis SQLite
2. Importez dans PostgreSQL
3. Mettez à jour `DATABASE_URL` dans votre configuration

## 📊 Monitoring

- Surveillez les logs : `docker-compose logs -f backend`
- Vérifiez la santé : `curl http://localhost:8000/health`
- Surveillez l'utilisation de la base de données

## 🛠️ Maintenance

### Réinitialiser la base de données (Développement uniquement)

```bash
# Via l'API (si endpoint admin est activé)
curl -X POST http://localhost:8000/api/v1/admin/reset-db

# Via le script
cd backend && python3 find_and_reset_db.py
```

**⚠️ Attention** : Ne jamais utiliser ces méthodes en production ! Utilisez des migrations de base de données appropriées.

## 🔒 Recommandations de Sécurité

1. ✅ Utilisez HTTPS en production
2. ✅ Changez tous les mots de passe par défaut
3. ✅ Limitez les origines CORS
4. ✅ Utilisez un secret key fort et unique
5. ✅ Configurez un firewall
6. ✅ Faites des sauvegardes régulières de la base de données
7. ✅ Surveillez les logs pour détecter les tentatives d'intrusion

## 📝 Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] SECRET_KEY changé
- [ ] Mots de passe de la DB changés
- [ ] CORS configuré pour votre domaine
- [ ] HTTPS configuré
- [ ] Base de données PostgreSQL configurée
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring en place
- [ ] Tests effectués en environnement de staging

