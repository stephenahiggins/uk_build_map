# LFG Project

This repository contains the codebase for the LFG OKR tracking platform, which provides a platform for tracking local government projects and user engagement.

## Project Structure

- `backend/` — Node.js/Express API, Prisma ORM, Dockerized, MySQL database
- `frontend/` — React-based frontend (TypeScript)

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (for local development outside Docker)

### Environment Variables
Copy `.env.example` to `.env` and fill in required values for both backend and frontend as needed.

### Backend Development

1. **Start Services**
   ```sh
   cd backend
   make up
   ```
2. **Apply Prisma Migrations**
   ```sh
   make migrate
   ```
3. **Open a Shell in the Container**
   ```sh
   make shell
   ```
4. **View Logs**
   ```sh
   make logs
   ```
5. **Seed the Database**
   ```sh
   make seed
   ```
6. **Run Tests**
   ```sh
   make test
   ```

### Frontend Development

1. Install dependencies and run the dev server:
   ```sh
   cd frontend
   npm install
   npm start
   ```

## Database
- Uses MySQL, managed via Docker Compose
- Prisma ORM for schema and migrations

## Useful Makefile Commands (in backend/)
| Command          | Description                            |
|------------------|----------------------------------------|
| make up          | Start backend & db containers          |
| make down        | Stop and remove containers             |
| make logs        | Tail backend service logs              |
| make shell       | Shell into backend container           |
| make migrate     | Run Prisma migrations                  |
| make prisma-generate | Generate Prisma client             |
| make seed        | Run Prisma seed script                 |
| make test        | Run backend tests                      |

## API Documentation
- Swagger UI available at `/api-docs/:version` (when not in production)

## Contributing
Pull requests and issues are welcome! Please lint and test your code before submitting.

---

For more details, see the documentation in each subdirectory.
