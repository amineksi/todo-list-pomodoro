.PHONY: help install dev test build docker-up docker-down clean

help: ## Affiche cette aide
	@echo "Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances (backend + frontend)
	cd backend && pip install -r requirements.txt
	cd frontend && npm install


dev-backend: ## Lance le backend en mode développement
	cd backend && python3 run.py

dev-frontend: ## Lance le frontend en mode développement
	cd frontend && npm run dev

test: ## Lance les tests backend
	cd backend && pytest tests/ -v

build: ## Build le frontend pour la production
	cd frontend && npm run build

docker-up: ## Lance les conteneurs Docker
	docker-compose up -d

docker-down: ## Arrête les conteneurs Docker
	docker-compose down

docker-logs: ## Affiche les logs Docker
	docker-compose logs -f

docker-restart: ## Redémarre les containers
	docker-compose restart

docker-clean: ## Nettoie les containers et volumes
	docker-compose down -v

reset-db: ## Réinitialise la base de données PostgreSQL (supprime toutes les données)
	@if [ -d "backend/venv" ]; then \
		cd backend && venv/bin/python3 find_and_reset_db.py; \
	else \
		cd backend && python3 find_and_reset_db.py; \
	fi

reset-db-simple: ## Réinitialise la DB PostgreSQL (plus rapide, sans confirmation)
	@echo "⚠️  Resetting PostgreSQL database..."
	@if [ -d "backend/venv" ]; then \
		cd backend && venv/bin/python3 reset_postgres.py --yes 2>/dev/null || \
		cd backend && python3 reset_postgres.py --yes 2>/dev/null || \
		cd backend && python3 find_and_reset_db.py; \
	else \
		cd backend && python3 reset_postgres.py --yes 2>/dev/null || \
		cd backend && python3 find_and_reset_db.py; \
	fi

clean: ## Nettoie les fichiers générés
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/dist frontend/.next frontend/out frontend/build
	rm -f backend/*.db backend/*.sqlite backend/*.sqlite3
	rm -f *.log *.tmp *.temp *.bak

clean-all: ## Nettoie tout (y compris node_modules et venv)
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name "*.pyd" -delete 2>/dev/null || true
	rm -rf frontend/dist frontend/.next frontend/out frontend/build
	rm -rf frontend/node_modules
	rm -rf backend/venv
	rm -f backend/*.db backend/*.sqlite backend/*.sqlite3
	rm -f *.log *.tmp *.temp *.bak
	find . -name ".DS_Store" -delete 2>/dev/null || true
