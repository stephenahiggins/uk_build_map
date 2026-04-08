variable "do_token" {
  description = "DigitalOcean personal access token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Public SSH key for the deploy user"
  type        = string
}

variable "project_name" {
  description = "Prefix used when naming cloud resources"
  type        = string
  default     = "growthmap"
}

variable "region" {
  description = "DigitalOcean region slug for the Droplet and volume"
  type        = string
  default     = "lon1"
}

variable "droplet_size" {
  description = "Droplet size slug"
  type        = string
  default     = "s-1vcpu-2gb"
}

variable "droplet_image" {
  description = "Droplet base image"
  type        = string
  default     = "ubuntu-22-04-x64"
}

variable "mysql_volume_size" {
  description = "Size of the persistent data volume in GB"
  type        = number
  default     = 25
}
