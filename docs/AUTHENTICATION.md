# 🔐 Système d'authentification

Ce document décrit le système d'authentification implémenté dans l'application Pomodoro Task Manager.

## Vue d'ensemble

Le système d'authentification utilise:
- **JWT (JSON Web Tokens)** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe
- **OAuth2** pour le flux de connexion

## Backend

### Modèles

#### User
- `id`: Identifiant unique
- `email`: Email unique de l'utilisateur
- `username`: Nom d'utilisateur unique
- `hashed_password`: Mot de passe haché avec bcrypt
- `is_active`: Statut actif/inactif
- `created_at`, `updated_at`: Timestamps

#### Modifications des modèles existants

- **Task**: Ajout du champ `user_id` pour lier les tâches aux utilisateurs
- **PomodoroSession**: Lié indirectement via Task

### Endpoints d'authentification

#### POST `/api/v1/auth/register`
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

#### POST `/api/v1/auth/login`
Se connecter et obtenir un token JWT.

**Body (form-urlencoded):**
```
username=username&password=password123
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET `/api/v1/auth/me`
Obtenir les informations de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Protection des routes

Toutes les routes existantes (tasks, pomodoro, stats) sont maintenant protégées et nécessitent un token JWT valide. Les données sont automatiquement filtrées par utilisateur.

**Exemple d'utilisation:**
```python
from ...core.dependencies import get_current_active_user

@router.get("/tasks")
def get_tasks(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Les tâches sont automatiquement filtrées pour current_user
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    return tasks
```

## Frontend

### Contexte d'authentification

Le contexte `AuthContext` fournit:
- `user`: Informations de l'utilisateur connecté
- `token`: Token JWT
- `login(username, password)`: Fonction de connexion
- `register(email, username, password)`: Fonction d'inscription
- `logout()`: Fonction de déconnexion
- `isAuthenticated`: Boolean indiquant si l'utilisateur est connecté
- `isLoading`: Boolean indiquant le chargement

### Pages

#### `/login`
Page de connexion avec formulaire username/password.

#### `/register`
Page d'inscription avec formulaire email/username/password.

### Protection des routes

Le composant `Layout` protège automatiquement toutes les routes sauf `/login` et `/register`. Si un utilisateur non authentifié essaie d'accéder à une page protégée, il est redirigé vers la page de connexion.

### Stockage du token

Le token JWT est stocké dans `localStorage` avec la clé `auth_token`. Les informations utilisateur sont stockées avec la clé `auth_user`.

### Intercepteur API

L'intercepteur axios gère automatiquement:
- L'ajout du token dans les headers pour toutes les requêtes
- La redirection vers `/login` en cas d'erreur 401 (non autorisé)

## Migration de la base de données

⚠️ **Important**: Lors de la première exécution avec le système d'authentification, la base de données sera mise à jour avec les nouvelles tables. Cependant:

1. **Les tâches existantes** n'auront pas de `user_id` et ne seront pas accessibles
2. **Solution recommandée**: Supprimer l'ancienne base de données et créer de nouveaux comptes utilisateurs

Pour réinitialiser la base de données:
```bash
# Supprimer l'ancienne base de données
rm backend/pomodoro_tasks.db

# Redémarrer le backend (les tables seront recréées)
```

## Configuration

### Variables d'environnement

Le backend utilise les variables suivantes (définies dans `backend/app/core/config.py`):

- `SECRET_KEY`: Clé secrète pour signer les tokens JWT (changez-la en production!)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Durée de validité du token (défaut: 8 jours)

### Production

Pour la production, assurez-vous de:
1. Changer `SECRET_KEY` pour une valeur sécurisée et aléatoire
2. Configurer `ACCESS_TOKEN_EXPIRE_MINUTES` selon vos besoins
3. Utiliser HTTPS pour transmettre les tokens de manière sécurisée
4. Configurer CORS correctement pour votre domaine

## Utilisation

### Créer un compte

1. Aller sur `/register`
2. Remplir le formulaire (email, username, password)
3. Le compte est créé et vous êtes automatiquement connecté

### Se connecter

1. Aller sur `/login`
2. Entrer username (ou email) et password
3. Vous êtes redirigé vers le dashboard

### Accéder aux données

Une fois connecté, toutes les données (tâches, pomodoros, statistiques) sont automatiquement filtrées pour votre compte utilisateur.

## Sécurité

- Les mots de passe sont hachés avec bcrypt
- Les tokens JWT sont signés avec HS256
- Les routes sont protégées par authentification
- Les données sont isolées par utilisateur
- Les tokens expirent après la durée configurée

