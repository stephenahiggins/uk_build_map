variable "project_name" {
  description = "Prefix used for all provisioned infrastructure"
  type        = string
  default     = "growthmap"
}

variable "hcloud_token" {
  description = "API token for Hetzner Cloud"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Public SSH key used for remote access"
  type        = string
}

variable "server_type" {
  description = "Hetzner Cloud server type"
  type        = string
  default     = "cpx11"
}

variable "server_location" {
  description = "Hetzner location slug (e.g. nbg1, fsn1, hel1)"
  type        = string
  default     = "nbg1"
}

variable "server_image" {
  description = "Base image for the application server"
  type        = string
  default     = "ubuntu-22.04"
}

variable "mysql_volume_size" {
  description = "Size (in GB) of the persistent data volume"
  type        = number
  default     = 40
}
