# Pomodoro Task Manager

A simple, clean app to manage tasks and focus using the Pomodoro technique.

Built with **Next.js 14**, **FastAPI**, and **PostgreSQL**.

## Features

* **Focus Timer:** Standard 25/5 intervals with auto-tracking.
* **Task Management:** Priorities, due dates, and status (Todo/Doing/Done).
* **Insights:** Dashboard with productivity stats and completion rates.
* **Secure:** Complete JWT authentication flow with user isolation.

## Quick Start (Docker)

The easiest way to run the app.

```bash
# 1. Clone
git clone https://github.com/amineksi/todo-list-pomodoro
cd todo-list-pomodoro

# 2. Run (Starts Frontend, Backend, and DB)
docker-compose up -d
