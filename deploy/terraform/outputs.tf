output "server_ipv4" {
  description = "Public IPv4 address of the application server"
  value       = hcloud_server.app.ipv4_address
}

output "volume_device_path" {
  description = "Device path of the attached persistent volume"
  value       = "/dev/disk/by-id/scsi-0HC_Volume_${hcloud_volume.data.id}"
}
