provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_ssh_key" "deployer" {
  name       = "${var.project_name}-deployer"
  public_key = var.ssh_public_key
}

resource "hcloud_volume" "data" {
  name     = "${var.project_name}-data"
  size     = var.mysql_volume_size
  location = var.server_location
  format   = "ext4"
}

resource "hcloud_server" "app" {
  name        = "${var.project_name}-app"
  image       = var.server_image
  server_type = var.server_type
  location    = var.server_location
  ssh_keys    = [hcloud_ssh_key.deployer.id]

  user_data = templatefile("${path.module}/cloud_init.yaml.tpl", {
    volume_device = "/dev/disk/by-id/scsi-0HC_Volume_${hcloud_volume.data.id}"
  })
}

resource "hcloud_volume_attachment" "app_data" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.app.id
}

resource "hcloud_firewall" "app" {
  name = "${var.project_name}-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "out"
    protocol  = "tcp"
    port      = "any"
  }

  rule {
    direction = "out"
    protocol  = "udp"
    port      = "any"
  }

  apply_to {
    server = hcloud_server.app.id
  }
}
