# Production deployment pipeline

This directory contains the Terraform configuration, Docker images, and automation
required to deploy the GrowthMap OKR stack to a single Hetzner Cloud virtual
machine. The workflow is optimised for low monthly cost while still providing
repeatable infrastructure and one-click deployments from GitHub Actions.

> Looking for DigitalOcean instead? See [`deploy/digitalocean/`](./digitalocean/)
> and the accompanying GitHub Actions workflow for a drop-in alternative that
> provisions an equivalent stack on a Droplet.

## Architecture overview

* **Infrastructure** – Terraform provisions a small Hetzner Cloud server, attaches
  a persistent volume that stores MySQL data/uploads/TLS assets, installs Docker
  via cloud-init, and configures a basic firewall.
* **Containers** – Docker Compose runs three services:
  * `mysql` (MySQL 8.4) with data persisted on the attached volume.
  * `backend` (Express + Prisma) built from `deploy/docker/backend.Dockerfile` and
    running in production mode with automatic migrations on start.
  * `caddy` (Caddy 2) built from `deploy/docker/frontend.Dockerfile`, serving the
    React build and terminating TLS for `growthmap.uk` and
    `api.growthmap.uk`.
* **CI/CD** – `.github/workflows/deploy.yml` runs tests, builds and publishes the
  Docker images to GitHub Container Registry (GHCR), applies Terraform, renders
  environment files from repository secrets, and restarts the stack on the
  server.

The resulting setup keeps everything in a single, inexpensive VPS while still
allowing you to recreate or replace the host through Terraform in minutes.

## Required GitHub secrets

Create the following repository secrets before enabling the workflow:

| Secret | Description |
| --- | --- |
| `HCLOUD_API_TOKEN` | Hetzner Cloud API token with read/write access. |
| `SSH_PUBLIC_KEY` | Public key uploaded to the repo so Terraform can register it. |
| `SSH_PRIVATE_KEY` | Matching private key used by the deploy job for SSH. |
| `GHCR_PAT` | Personal access token with `read:packages` to pull images from GHCR on the server. |
| `BACKEND_ENV` | Multi-line contents of `deploy/env/backend.env` (production secrets). |
| `MYSQL_ENV` | Multi-line contents of `deploy/env/mysql.env`. |
| `CADDY_ENV` | Multi-line contents of `deploy/env/caddy.env`. |
| `REACT_APP_API_URL` | Public API base URL, e.g. `https://api.growthmap.uk`. |

Optionally define `TF_VAR_project_name`, `TF_VAR_server_type`, or
`TF_VAR_server_location` as secrets/variables to override defaults.

## Preparing environment files

Copy the examples in `deploy/env/*.example`, customise the values, and store the
final contents in the corresponding GitHub secrets listed above. The deployment
workflow will materialise the files under `/opt/lfg/env` on the server each run.

## Running Terraform locally

Terraform expects two variables: `hcloud_token` and `ssh_public_key`. The GitHub
Actions workflow injects them via `TF_VAR_…`, but you can apply them locally:

```sh
cd deploy/terraform
export TF_VAR_hcloud_token=your-token
export TF_VAR_ssh_public_key="$(cat ~/.ssh/id_rsa.pub)"
terraform init
terraform apply
```

After the server is provisioned you can run the GitHub workflow to build images
and push the application live.

## Deploying from GitHub Actions

1. Push to `main` or trigger the **Deploy** workflow manually.
2. The pipeline runs TypeScript builds for the backend and frontend.
3. Docker images are built and pushed to GHCR with tags `latest` and the commit
   SHA.
4. Terraform ensures the Hetzner infrastructure matches the configuration.
5. Environment files and `docker-compose.yml` are uploaded to the server and the
   stack is restarted with the freshly built images.

## DNS requirements

Point the following DNS records to the server’s public IP (Terraform output
`server_ipv4`):

* `growthmap.uk` and `www.growthmap.uk` → A record to the server (Caddy serves the SPA).
* `api.growthmap.uk` → A record to the same server (Caddy proxies to the backend).

Caddy automatically provisions TLS certificates using the `ACME_EMAIL` from
`caddy.env`.

## Database migrations and seeds

The backend container runs `prisma migrate deploy` on startup. For initial data
seeding you can execute the seed script manually once the stack is up:

```sh
ssh root@<server-ip>
cd /opt/lfg
docker compose run --rm backend npm run seed
```

## Backups

Hetzner volumes support snapshotting. Schedule snapshots of the volume created by
Terraform (see `deploy/terraform/outputs.tf`) to protect database/uploads data.
