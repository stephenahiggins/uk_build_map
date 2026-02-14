#cloud-config
package_update: true
package_upgrade: true
packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - lsb-release

write_files:
  - path: /etc/docker/daemon.json
    content: |
      {
        "log-driver": "json-file",
        "log-opts": {
          "max-size": "10m",
          "max-file": "3"
        }
      }

runcmd:
  - |
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  - |
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  - apt-get update
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  - systemctl enable docker
  - systemctl start docker
  - mkdir -p /opt/lfg/env
  - mkdir -p /opt/lfg/data/mysql
  - mkdir -p /opt/lfg/data/uploads
  - mkdir -p /opt/lfg/data/caddy-data
  - mkdir -p /opt/lfg/data/caddy-config
  - chown -R root:docker /opt/lfg
  - chmod -R 775 /opt/lfg

fs_setup:
  - label: lfg-data
    filesystem: ext4
    device: ${volume_device}
    overwrite: false

mounts:
  - [${volume_device}, /opt/lfg/data, ext4, "defaults,nofail", "0", "2"]
