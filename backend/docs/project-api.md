# Project and Evidence API

This document describes the REST endpoints used to create projects and to submit evidence for a project. Authentication is required via a JWT bearer token unless `NODE_ENV` is set to `development`.

## Authentication

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

In development mode (`NODE_ENV=development`), the `authMiddleware` bypasses authentication for convenience.

## Create a Project

`POST /api/v1/projects`

Creates a new `Project` based on the Prisma model. Important fields include:

- `title` *(string, required)* – project name
- `description` *(string, optional)*
- `type` *(`LOCAL_GOV` | `NATIONAL_GOV` | `REGIONAL_GOV`)*
- `regionId` *(string, optional)*
- `localAuthorityId` *(string, optional)*
- `expectedCompletion` *(ISO date string, optional)*
- `status` *(`RED` | `AMBER` | `GREEN`)*
- `statusRationale` *(string, optional)*
- `latitude` and `longitude` *(decimal numbers, optional)*

Example using `curl`:

```bash
curl -X POST http://localhost:5002/api/v1/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Cycleway",
    "type": "LOCAL_GOV",
    "regionId": "<region-id>",
    "status": "GREEN"
  }'
```

## Add Evidence to a Project

`POST /api/v1/projects/:id/evidence`

Adds an `EvidenceItem` linked to the specified project. Key fields from the Prisma schema are:

- `type` *(`PDF` | `URL` | `TEXT` | `DATE`)*
- `title` *(string, required)*
- `summary` *(string, optional)*
- `source` *(string, optional)*
- `url` *(string, optional)*
- `datePublished` *(ISO date string, optional)*
- `description` *(string, optional)*
- `latitude` and `longitude` *(decimal numbers, optional)*

Example:

```bash
curl -X POST http://localhost:5002/api/v1/projects/<project-id>/evidence \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "URL",
    "title": "Council announcement",
    "url": "https://example.com/news",
    "summary": "Funding approved"
  }'
```

Both endpoints respond with the created record on success.
