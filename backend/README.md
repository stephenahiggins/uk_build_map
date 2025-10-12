# Node Boilerplate TS App

This project is a Node.js application using TypeScript, Docker, and MySQL. It includes Prisma for database management and Docker Compose for easy setup and management of development environments.

## Prerequisites

Before you start, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

Follow these steps to set up and run the project:

### 1. Clone the Repository

Clone the repository to your local machine:

git clone <repository-url>
cd <repository-directory>

Replace `<repository-url>` with the URL of your repository and `<repository-directory>` with the name of the directory where the repository is cloned.

### 2. Set Up Environment Variables

Create a `.env` file in the root directory of the project with the following content:

```env
PORT=5002
NODE_ENV="development" # development, staging, production
GOOGLE_CLIENT_ID=""
EMAIL_USER="youremail@example.com"
EMAIL_PASS=""
FRONTEND_URL="http://localhost:3001"

# auth >>>
JWT_ACCESS_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-secret"
JWT_ACCESS_EXPIRATION='15m'  # Access tokens should be short-lived
JWT_REFRESH_EXPIRATION='7d'  # Refresh tokens can have longer lifetimes


# database
DATABASE_URL="mysql://root:password@localhost:3306/node_boilerplate" #for local connection

# for docker connection >>>>>>>>>>>>
DATABASE_USER="root"
DATABASE_NAME="node_boilerplate"
DATABASE_PASSWORD="123456"
DATABASE_PORT=3306
DATABASE_HOST="db"
DATABASE_URL="mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}" 
# for docker connection <<<<<<<<<<<<<

```
Create a `.env.test` file in the root directory of the project to run tests with the following content:
```
PORT=5002
NODE_ENV="development" # development, staging, production
GOOGLE_CLIENT_ID=""

---

# Project API Routes

## Create a Project

**POST** `/api/v1/projects`

Create a new project.

**Request Body (JSON):**

| Field             | Type     | Required | Description                                 |
|-------------------|----------|----------|---------------------------------------------|
| title             | string   | Yes      | Project title                               |
| description       | string   | No       | Project description                         |
| type              | string   | Yes      | Project type (`LOCAL_GOV`, `NATIONAL_GOV`, `REGIONAL_GOV`) |
| regionId          | string   | Yes      | Associated region ID                        |
| localAuthorityId  | string   | No       | Associated local authority ID               |
| expectedCompletion| string   | No       | Expected completion date (ISO 8601)         |
| status            | string   | Yes      | Project status (`RED`, `AMBER`, `GREEN`)    |
| statusRationale   | string   | No       | Reason for project status                   |
| latitude          | number   | No       | Project latitude                            |
| longitude         | number   | No       | Project longitude                           |
| locationDescription | string | No       | Short description of the primary project location |
| locationSource    | string   | No       | Source citation for the location            |
| locationConfidence| string   | No       | Confidence in the location (`LOW`, `MEDIUM`, `HIGH`) |

**Response:**  
Returns the created project object.

---

## Get All Projects

**GET** `/api/v1/projects`

Retrieve a list of projects. All parameters are optional and can be used as filters (combined as needed).

**Query Parameters:**

| Parameter         | Type     | Description                                        |
|-------------------|----------|----------------------------------------------------|
| id                | string   | Filter by project ID                               |
| title             | string   | Filter by title (case-insensitive, partial match)  |
| description       | string   | Filter by description (case-insensitive, partial)  |
| type              | string   | Filter by type (`LOCAL_GOV`, `NATIONAL_GOV`, `REGIONAL_GOV`) |
| regionId          | string   | Filter by region ID                                |
| localAuthorityId  | string   | Filter by local authority ID                       |
| expectedCompletion| string   | Filter by expected completion date (ISO 8601)      |
| status            | string   | Filter by status (`RED`, `AMBER`, `GREEN`)         |
| statusRationale   | string   | Filter by status rationale (case-insensitive, partial) |
| latitude          | number   | Filter by latitude                                 |
| longitude         | number   | Filter by longitude                                |
| locationDescription | string | Filter by location description (case-insensitive)  |
| locationSource    | string   | Filter by location source (case-insensitive)       |
| locationConfidence| string   | Filter by location confidence (`LOW`, `MEDIUM`, `HIGH`) |
| createdAt         | string   | Filter by creation date (ISO 8601)                 |

**Response:**  
Returns an array of project objects matching the filters.

**Example:**  
`GET /api/v1/projects?type=LOCAL_GOV&regionId=abc123&status=GREEN`

---

## Get Project by ID

**GET** `/api/v1/projects/:id`

Retrieve a single project by its ID.

**Response:**  
Returns the project object or 404 if not found.

---

## Update Project

**POST** `/api/v1/projects/:id`

Update an existing project.

**Request Body:**  
Same as "Create a Project" (fields optional; only provided fields will be updated).

**Response:**  
Returns the updated project object.

---

EMAIL_USER="youremail@example.com"
EMAIL_PASS=""
FRONTEND_URL="http://localhost:3001"

# auth >>>
JWT_ACCESS_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-secret"
JWT_ACCESS_EXPIRATION='15m'  # Access tokens should be short-lived
JWT_REFRESH_EXPIRATION='7d'  # Refresh tokens can have longer lifetimes


# database
DATABASE_URL="mysql://root:password@localhost:3306/node_boilerplate" #for local connection

# for docker connection >>>>>>>>>>>>
# DATABASE_USER="root"
# DATABASE_NAME="node_boilerplate"
# DATABASE_PASSWORD="123456"
# DATABASE_PORT=3307
# DATABASE_HOST="localhost"
# DATABASE_URL="mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}" 
# for docker connection <<<<<<<<<<<<<

```

### 3. Run Docker Compose to build and start the containers:

```
docker-compose up --build
```

**Note on Database Seeding:**  
The application automatically seeds the database on startup:
- **Users, Regions, and Local Authorities** are seeded via `prisma/seed.ts`
- **Projects and Evidence** are seeded from `prisma/seed/LFG.sql`

Both seeding operations run during container startup via `entrypoint.sh`. If you need to manually re-seed projects, run:
```bash
docker-compose exec db mysql -u root -prootpassword node_boilerplate < prisma/seed/LFG.sql
```

### 4. Accessing the Application

Once the containers are up and running, you can access the application at: http://localhost:5002

### 5. Stopping the Containers

To stop and remove the containers, use:
```
docker-compose down
```








