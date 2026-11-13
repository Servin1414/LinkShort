# LinkShort

A local URL shortener with user authentication, private links, and click analytics.

## Requirements

Install the following software before setting up LinkShort:

- Windows 10 or Windows 11
- Node.js (LTS)
- Docker Desktop

Make sure Docker Desktop is running before setup.

## Installation

1. Extract the project ZIP file into a folder.
2. Open the extracted `LinkShort` folder.
3. Double-click `SETUP.bat`.
4. Wait until the setup process finishes successfully.
5. Double-click `START.bat`.

The setup script installs project dependencies, starts PostgreSQL, generates the Prisma client, and prepares the database tables.

## Access the application

- Frontend: http://127.0.0.1:5173
- Backend health check: http://127.0.0.1:3000/api/health

Register an account before creating and managing links.

## Stopping the application

Press `Ctrl+C` in the terminal running `START.bat`.

## Database

LinkShort uses PostgreSQL through Docker Compose.

The database data is stored in a Docker volume and remains available when the application stops and starts again.

## Important notes

- This project is intended for local demonstration and educational use.
- Keep `backend/.env` private. Do not publish it or include it in the project ZIP.
- Do not delete the Docker database volume if you want to preserve saved users and links.
- The application uses local addresses and is not configured for public deployment.

## Troubleshooting

### Docker is not running

Open Docker Desktop, wait until it is ready, and run `SETUP.bat` or `START.bat` again.

### The application does not start

Run `SETUP.bat` first and check the error displayed in the terminal.

### The frontend cannot connect to the backend

Make sure the backend is running and port `3000` is available.

### PostgreSQL does not start

Run the following command in the project folder:

bash
docker compose logs postgres
