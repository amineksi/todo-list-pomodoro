.PHONY: help install dev test build docker-up docker-down clean

help: ## Affiche cette aide
	@echo "Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances (backend + frontend)
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend: ## Lance le backend en mode développement
	cd backend && python run.py

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

clean: ## Nettoie les fichiers générés
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/venv
	rm -f backend/*.db
