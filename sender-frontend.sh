#!/bin/bash

# Constants
SERVICE="sender-frontend.service"
UNIT_FILE="/lib/systemd/system/$SERVICE"
IMAGE="ghcr.io/upri-earthquake/sender-frontend:0.0.2" #TODO: Change tag to :latest
CONTAINER="sender-frontend"
DOCKER_NETWORK="UPRI-docker-network"

function install_service() {
    # Check if unit-file exists
    if [[ -f "$UNIT_FILE" ]]; then
        echo "Unit file $UNIT_FILE already exists."
    else
    # Write unit-file
        cat <<EOF > "$UNIT_FILE"
[Unit]
Description=UPRI: Sender Frontend Service
After=docker.service sender-backend.service
Requires=docker.service sender-backend.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=myshake
ExecStart=/usr/local/bin/sender-frontend START
ExecStop=/usr/local/bin/sender-frontend STOP

[Install]
WantedBy=multi-user.target
EOF
      echo "Unit file $UNIT_FILE written."

      # Check if unit-file is successfully written as a disabled service
      systemctl daemon-reload
      systemctl --quiet enable "$SERVICE" >/dev/null 2>&1
      if [[ $? -eq 0 ]]; then
          echo "$SERVICE installed as an enabled service."
          return 0  # Success
      else
          echo "Something went wrong in installing $SERVICE."
          return 1  # Failure
      fi
    fi
}

function pull_container() {
    if docker inspect "$IMAGE" >/dev/null 2>&1; then
      echo "Image $IMAGE already exists."
      return 0 # Success
    else
      docker pull "$IMAGE"
      if [[ $? -eq 0 ]]; then
          echo "Image $IMAGE pulled successfully."
          return 0
      else
          echo "Failed to pull image $IMAGE."
          return 1
      fi
    fi
}

function create_network() {
    if docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
        echo "Docker network $DOCKER_NETWORK already exists."
        return 0 # Success
    else
        # create network
        docker network create \
            --driver bridge \
            --subnet 172.18.0.0/16 \
            --gateway 172.18.0.1 \
            --ip-range 172.18.0.0/24 \
            "$DOCKER_NETWORK"
            # 1st volume: workaround for docker's oci runtime error
            # 2nd volume: contains NET and STAT info
            # 3rd volume: will contain local file storage of sender-backend server
  
        if [[ $? -eq 0 ]]; then
            echo "Network $DOCKER_NETWORK created successfully."
            return 0
        else
            echo "Failed to create network $DOCKER_NETWORK."
            return 1
        fi

    fi
}

function create_container() {
    if docker inspect "$CONTAINER" >/dev/null 2>&1; then
        echo "Container $CONTAINER already exists."
        return 0 # Success
    else
        # create container
        docker create \
            --name "$CONTAINER" \
            --volume /sys/fs/cgroup:/sys/fs/cgroup:ro \
            --net UPRI-docker-network \
            --env NGINX_PORT=3000 \
            --publish 0.0.0.0:3000:3000 \
            "$IMAGE"
            # volume: workaround for docker's oci runtime error
            # net: make sender-backend be accessible by name from frontend
            # publish: make port of host passthrough port of container

        if [[ $? -eq 0 ]]; then
            echo "Container $CONTAINER created successfully."
            return 0
        else
            echo "Failed to create container $CONTAINER."
            return 1
        fi
    fi
}

function start_container() {
    if [[ $(docker container inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null) == "true" ]]; then
        echo "Container $CONTAINER is already running."
    else
        docker start "$CONTAINER"
        if [[ $? -eq 0 ]]; then
            echo "Container $CONTAINER started successfully."
            return 0
        else
            echo "Failed to start container $CONTAINER."
            return 1
        fi
    fi
}

function stop_container() {
    if [[ $(docker container inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null) == "true" ]]; then
        docker stop "$CONTAINER"
        if [[ $? -eq 0 ]]; then
            echo "Container $CONTAINER stopped successfully."
            return 0
        else
            echo "Failed to stop container $CONTAINER."
            return 1
        fi
    else
        echo "Container $CONTAINER is not running."
    fi
}

## execute function based on argument: INSTALL_SERVICE, NETWORK_SETUP, PULL, CREATE, START, STOP
case $1 in
    "INSTALL_SERVICE")
        install_service
        ;;
    "PULL")
        pull_container
        ;;
    "NETWORK_SETUP")
        create_network
        ;;
    "CREATE")
        create_container
        ;;
    "START")
        start_container
        ;;
    "STOP")
        stop_container
        ;;
    *)
        echo "Invalid argument. Usage: ./script.sh [INSTALL_SERVICE|NETWORK_SETUP|PULL|CREATE|START|STOP]"
        ;;
esac



