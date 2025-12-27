# 📡 Documentation API

Documentation complète de l'API REST du Pomodoro Task Manager.

## Base URL

```
http://localhost:8000/api/v1
```

## Endpoints

### Tasks

#### Créer une tâche
```http
POST /tasks
Content-Type: application/json

{
  "title": "Ma tâche",
  "description": "Description optionnelle",
  "status": "todo",
  "priority": "medium",
  "due_date": "2024-12-31T23:59:59"
}
```

#### Lister les tâches
```http
GET /tasks?skip=0&limit=100&status_filter=todo
```

#### Obtenir une tâche
```http
GET /tasks/{id}
```

#### Modifier une tâche
```http
PUT /tasks/{id}
Content-Type: application/json

{
  "title": "Tâche modifiée",
  "status": "in_progress"
}
```

#### Supprimer une tâche
```http
DELETE /tasks/{id}
```

### Pomodoro Sessions

#### Créer une session
```http
POST /pomodoro
Content-Type: application/json

{
  "task_id": 1,
  "duration_minutes": 25,
  "session_type": "work"
}
```

#### Démarrer une session
```http
POST /pomodoro/{id}/start
```

#### Terminer une session
```http
POST /pomodoro/{id}/complete
```

#### Lister les sessions
```http
GET /pomodoro?task_id=1
```

### Statistiques

#### Dashboard complet
```http
GET /stats/dashboard
```

Réponse:
```json
{
  "task_stats": {
    "total_tasks": 10,
    "completed_tasks": 5,
    "in_progress_tasks": 2,
    "todo_tasks": 3,
    "completion_rate": 50.0
  },
  "pomodoro_stats": {
    "total_sessions": 20,
    "completed_sessions": 18,
    "total_work_minutes": 450,
    "average_session_duration": 25.0,
    "sessions_today": 3,
    "work_minutes_today": 75
  }
}
```

## Codes de Statut

- `200` - Succès
- `201` - Créé
- `204` - Pas de contenu (suppression réussie)
- `400` - Requête invalide
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## Documentation Interactive

Accédez à la documentation interactive Swagger UI:
```
http://localhost:8000/docs
```

Ou ReDoc:
```
http://localhost:8000/redoc
```
