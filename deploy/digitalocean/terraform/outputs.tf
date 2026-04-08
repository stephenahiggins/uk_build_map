output "droplet_ipv4" {
  description = "Public IPv4 address of the application droplet"
  value       = digitalocean_droplet.app.ipv4_address
}

output "droplet_ipv6" {
  description = "Public IPv6 address of the application droplet"
  value       = digitalocean_droplet.app.ipv6_address
}

output "volume_id" {
  description = "Identifier of the persistent data volume"
  value       = digitalocean_volume.data.id
}
