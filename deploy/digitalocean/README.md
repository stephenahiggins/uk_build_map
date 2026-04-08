# DigitalOcean deployment pipeline

This directory contains Terraform configuration and GitHub Actions automation for
running GrowthMap on a single DigitalOcean Droplet. The layout mirrors the
Hetzner pipeline but targets DigitalOcean resources, letting you pick whichever
provider fits your needs or budget.

## Architecture overview

* **Infrastructure** – Terraform provisions one Droplet, attaches a block
  storage volume that persists MySQL data/uploads/TLS assets, and hardens the
  host with a basic firewall. cloud-init installs Docker and prepares the `/opt/lfg`
  directory structure expected by the Compose stack.
* **Containers** – The existing production Dockerfiles under `deploy/docker/`
  build backend and frontend images. `deploy/docker-compose.yml` wires those up
  with MySQL and Caddy, identical to the Hetzner variant.
* **CI/CD** – The workflow `.github/workflows/deploy-digitalocean.yml` builds
  the Docker images, applies Terraform to create/update the Droplet, syncs
  environment files, and restarts the stack over SSH.

## Required GitHub secrets

Create these secrets/variables before enabling the workflow:

| Name | Purpose |
| --- | --- |
| `DO_API_TOKEN` | DigitalOcean personal access token with write access. |
| `SSH_PUBLIC_KEY` | Public key Terraform registers on the Droplet. |
| `SSH_PRIVATE_KEY` | Matching private key the workflow uses for SSH/SCP. |
| `GHCR_PAT` | PAT with `read:packages` so the Droplet can pull from GHCR. |
| `BACKEND_ENV` | Multi-line contents of `deploy/env/backend.env`. |
| `MYSQL_ENV` | Multi-line contents of `deploy/env/mysql.env`. |
| `CADDY_ENV` | Multi-line contents of `deploy/env/caddy.env`. |
| `REACT_APP_API_URL` | URL passed into the frontend build (e.g. `https://api.growthmap.uk`). |

Optional Terraform overrides can be supplied via
repository/environment variables such as `TF_VAR_project_name`,
`TF_VAR_region`, or `TF_VAR_droplet_size`.

## Terraform usage

The DigitalOcean Terraform code expects two required variables: `do_token` and
`ssh_public_key`. The GitHub workflow populates them with secrets, but you can
run Terraform locally for debugging:

```sh
cd deploy/digitalocean/terraform
export TF_VAR_do_token="$(cat ~/.config/do/token)"   # or paste inline
export TF_VAR_ssh_public_key="$(cat ~/.ssh/id_rsa.pub)"
terraform init
terraform apply
```

After the Droplet is provisioned, trigger the GitHub Actions workflow to push
the latest images and start the Compose stack.

## DNS & certificates

Point these DNS records to the Droplet's public IPv4 (Terraform output
`droplet_ipv4`):

* `growthmap.uk` and `www.growthmap.uk` → A records to the Droplet (Caddy serves the SPA).
* `api.growthmap.uk` → A record to the same host (Caddy proxies to the backend).

Caddy automatically issues Let's Encrypt certificates using the `ACME_EMAIL`
value from `caddy.env`.

## First run & maintenance

* The backend container executes `prisma migrate deploy` on start. Seed baseline
  data with `docker compose run --rm backend npm run seed` after the first
  deployment.
* Snapshots of the attached volume (configured via the DigitalOcean control
  panel or API) protect database/uploads data. Schedule them at an interval that
  matches your recovery point objectives.
* When switching between Hetzner and DigitalOcean pipelines, keep the secrets
  sets distinct—each workflow only reads the values it needs, so you can leave
  both configured simultaneously.
