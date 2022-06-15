#!/usr/bin/env bash
set -e # Exit immediately if a command exits with a non-zero status.

ROOT_FOLDER="$(readlink -f "$(dirname "${BASH_SOURCE[0]}")"/..)"

echo
echo "======================================"
if [[ -f "${ROOT_FOLDER}/state/configured" ]]; then
  echo "=========== RECONFIGURING ============"
else
  echo "============ CONFIGURING ============="
fi
echo "=============== TIPI ================="
echo "======================================"
echo

function install_docker() {
  local os="${1}"

  if [[ "${OS}" == "debian" ]]; then
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg jq lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    echo "sucess"
  elif [[ "${OS}" == "ubuntu" ]]; then
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg jq lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    echo "sucess"
  elif [[ "${OS}" == "centos" ]]; then
    sudo yum install -y yum-utils jq
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y --allowerasing docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "sucess"
  elif [[ "${OS}" == "fedora" ]]; then
    sudo dnf -y install dnf-plugins-core jq
    sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "sucess"
  elif [[ "${OS}" == "arch" ]]; then
    sudo pacman -Sy --noconfirm docker jq
    sudo systemctl start docker.service
    sudo systemctl enable docker.service

    if ! command -v crontab >/dev/null; then
      sudo pacman -Sy --noconfirm cronie
      systemctl enable --now cronie.service
    fi

    echo "sucess"
  else
    echo "error"
  fi
}

OS="$(cat /etc/[A-Za-z]*[_-][rv]e[lr]* | grep "^ID=" | cut -d= -f2 | uniq | tr '[:upper:]' '[:lower:]' | tr -d '"')"
SUB_OS="$(cat /etc/[A-Za-z]*[_-][rv]e[lr]* | grep "^ID_LIKE=" | cut -d= -f2 | uniq | tr '[:upper:]' '[:lower:]' | tr -d '"')"

if command -v docker >/dev/null; then
  echo "Docker is already installed"
else
  echo "Installing Docker"
  DOCKER_SUCCESS=$(install_docker "${OS}")
  if [[ "${DOCKER_SUCCESS}" == "sucess" ]]; then
    echo "docker installed"
  else
    DOCKER_SUCCESS=$(install_docker "${SUB_OS}")

    if [[ "${DOCKER_SUCCESS}" == "sucess" ]]; then
      echo "docker installed"
    else
      echo "Your system ${OS} is not supported please install docker manually"
      exit 1
    fi
  fi
fi

if ! command -v docker-compose >/dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.3.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Create configured status
touch "${ROOT_FOLDER}/state/configured"
