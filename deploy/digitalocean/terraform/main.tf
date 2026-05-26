provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_ssh_key" "deployer" {
  name       = "${var.project_name}-deployer"
  public_key = var.ssh_public_key
}

resource "digitalocean_volume" "data" {
  region = var.region
  name   = "${var.project_name}-data"
  size   = var.mysql_volume_size
}

locals {
  volume_device_path = "/dev/disk/by-id/scsi-0DO_Volume_${digitalocean_volume.data.id}"
}

resource "digitalocean_droplet" "app" {
  name   = "${var.project_name}-app"
  region = var.region
  image  = var.droplet_image
  size   = var.droplet_size

  monitoring = true
  ipv6       = true

  ssh_keys = [digitalocean_ssh_key.deployer.id]

  volume_ids = [digitalocean_volume.data.id]

  user_data = templatefile("${path.module}/cloud_init.yaml.tpl", {
    volume_device = local.volume_device_path
  })
}

resource "digitalocean_firewall" "app" {
  name = "${var.project_name}-fw"

  droplet_ids = [digitalocean_droplet.app.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
