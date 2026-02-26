#!/bin/bash

# Constants
SERVICE="sender-frontend.service"
UNIT_FILE="/lib/systemd/system/$SERVICE"
IMAGE="ghcr.io/upri-earthquake/sender-frontend:latest"
CONTAINER="sender-frontend"
DOCKER_NETWORK="UPRI-docker-network"
AUTO_UPDATE_ALERT_ENDPOINT_DEFAULT="https://earthquake.science.upd.edu.ph/api/messaging/restricted/rshake-alert"
AUTO_UPDATE_ALERT_TIMEOUT_SEC_DEFAULT=8
AUTO_UPDATE_STATE_FILE="/tmp/upri-sender-auto-update-state.env"
AUTO_UPDATE_STATE_TTL_SEC_DEFAULT=3600
LAST_PULL_RESULT="unknown"

function json_escape() {
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    value="${value//$'\r'/}"
    printf "%s" "$value"
}

function sanitize_token() {
    local value="$1"
    value="$(echo "$value" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g; s/^-*//; s/-*$//')"
    if [[ -z "$value" ]]; then
        printf "unknown"
    else
        printf "%s" "$value"
    fi
}

function read_device_value() {
    local file_path="$1"
    if [[ -r "$file_path" ]]; then
        tr -d '\r' < "$file_path" | head -n 1 | xargs
        return 0
    fi
    printf ""
    return 1
}

function classify_pull_state_from_output() {
    local output="$1"
    if echo "$output" | grep -qi "Downloaded newer image"; then
        printf "updated"
        return 0
    fi
    if echo "$output" | grep -qi "Image is up to date\|up to date for"; then
        printf "no-change"
        return 0
    fi
    if echo "$output" | grep -qi "pulled successfully"; then
        printf "pulled"
        return 0
    fi
    printf "unknown"
}

function read_backend_update_state() {
    BACKEND_STATE_PRESENT=0
    BACKEND_EXIT=1
    BACKEND_PULL_STATE="unknown"
    BACKEND_SCRIPT_UPDATE_STATE="unknown"
    FRONTEND_SCRIPT_UPDATE_STATE="unknown"
    BACKEND_IMAGE="unknown"
    BACKEND_CONTAINER="unknown"
    BACKEND_STATE_TS=0

    if [[ ! -r "$AUTO_UPDATE_STATE_FILE" ]]; then
        return 1
    fi

    while IFS='=' read -r key value; do
        case "$key" in
            BACKEND_EXIT) BACKEND_EXIT="$value" ;;
            BACKEND_PULL_STATE) BACKEND_PULL_STATE="$value" ;;
            BACKEND_SCRIPT_UPDATE_STATE) BACKEND_SCRIPT_UPDATE_STATE="$value" ;;
            FRONTEND_SCRIPT_UPDATE_STATE) FRONTEND_SCRIPT_UPDATE_STATE="$value" ;;
            BACKEND_IMAGE) BACKEND_IMAGE="$value" ;;
            BACKEND_CONTAINER) BACKEND_CONTAINER="$value" ;;
            STATE_TS) BACKEND_STATE_TS="$value" ;;
        esac
    done < "$AUTO_UPDATE_STATE_FILE"

    if ! [[ "$BACKEND_STATE_TS" =~ ^[0-9]+$ ]]; then
        rm -f "$AUTO_UPDATE_STATE_FILE" >/dev/null 2>&1
        return 1
    fi

    local now_ts ttl_sec age
    now_ts="$(date +%s)"
    ttl_sec="${AUTO_UPDATE_STATE_TTL_SEC:-$AUTO_UPDATE_STATE_TTL_SEC_DEFAULT}"
    if ! [[ "$ttl_sec" =~ ^[0-9]+$ ]]; then
        ttl_sec="$AUTO_UPDATE_STATE_TTL_SEC_DEFAULT"
    fi
    age=$((now_ts - BACKEND_STATE_TS))
    if (( age < 0 || age > ttl_sec )); then
        rm -f "$AUTO_UPDATE_STATE_FILE" >/dev/null 2>&1
        return 1
    fi

    BACKEND_STATE_PRESENT=1
    rm -f "$AUTO_UPDATE_STATE_FILE" >/dev/null 2>&1
    return 0
}

function post_auto_update_alert() {
    local alert_code="$1"
    local severity="$2"
    local summary="$3"
    local backend_exit="$4"
    local frontend_exit="$5"
    local backend_pull_state="$6"
    local frontend_pull_state="$7"
    local backend_image="$8"
    local frontend_image="$9"
    local backend_script_update="${10}"
    local frontend_script_update="${11}"

    if ! command -v curl >/dev/null 2>&1; then
        echo -en "[\e[1;33mWARN\e[0m] "
        echo "curl is unavailable; skipping auto-update alert post."
        return 0
    fi

    local network station mac stream_id message_id occurred_at endpoint timeout_sec dedupe_key schema_version
    local device_json first_field
    network="$(read_device_value /opt/settings/sys/NET.txt)"
    station="$(read_device_value /opt/settings/sys/STN.txt)"
    mac="$(read_device_value /opt/settings/sys/eth-mac.txt)"
    stream_id="${network}_${station}_.*/MSEED"

    if [[ -z "${network}${station}${mac}" ]]; then
        local host_fallback
        host_fallback="$(hostname 2>/dev/null || true)"
        if [[ -z "$host_fallback" ]]; then
            host_fallback="sender-frontend"
        fi
        stream_id="AUTO_UPDATE_${host_fallback}"
    fi

    occurred_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    if [[ -r /proc/sys/kernel/random/uuid ]]; then
        message_id="$(cat /proc/sys/kernel/random/uuid)"
    else
        message_id="$(date +%s%N)-$RANDOM"
    fi

    endpoint="${AUTO_UPDATE_ALERT_ENDPOINT:-$AUTO_UPDATE_ALERT_ENDPOINT_DEFAULT}"
    timeout_sec="${AUTO_UPDATE_ALERT_TIMEOUT_SEC:-$AUTO_UPDATE_ALERT_TIMEOUT_SEC_DEFAULT}"
    schema_version="${RSHAKE_ALERT_SCHEMA_VERSION:-1.0}"
    dedupe_key="auto-update.$(sanitize_token "${station:-$stream_id}").$(sanitize_token "$alert_code")"

    device_json="{"
    first_field=1
    if [[ -n "$network" ]]; then
        device_json="${device_json}\"network\":\"$(json_escape "$network")\""
        first_field=0
    fi
    if [[ -n "$station" ]]; then
        if [[ $first_field -eq 0 ]]; then
            device_json="${device_json},"
        fi
        device_json="${device_json}\"station\":\"$(json_escape "$station")\""
        first_field=0
    fi
    if [[ -n "$stream_id" ]]; then
        if [[ $first_field -eq 0 ]]; then
            device_json="${device_json},"
        fi
        device_json="${device_json}\"streamId\":\"$(json_escape "$stream_id")\""
        first_field=0
    fi
    if [[ -n "$mac" ]]; then
        if [[ $first_field -eq 0 ]]; then
            device_json="${device_json},"
        fi
        device_json="${device_json}\"macAddress\":\"$(json_escape "$mac")\""
        first_field=0
    fi
    if [[ $first_field -eq 1 ]]; then
        device_json="${device_json}\"streamId\":\"AUTO_UPDATE_SENDER\""
    fi
    device_json="${device_json}}"

    local payload
    payload=$(cat <<EOF
{"schemaVersion":"$(json_escape "$schema_version")","messageId":"$(json_escape "$message_id")","type":"device.alert","occurredAt":"$(json_escape "$occurred_at")","device":$device_json,"status":"AUTO_UPDATE","alertCode":"$(json_escape "$alert_code")","severity":"$(json_escape "$severity")","summary":"$(json_escape "$summary")","details":{"source":"sender-stack-auto-update","notificationScope":"admin-only","executionMode":"legacy-chained-update","backendExitCode":$backend_exit,"frontendExitCode":$frontend_exit,"backendPullState":"$(json_escape "$backend_pull_state")","frontendPullState":"$(json_escape "$frontend_pull_state")","backendScriptUpdate":"$(json_escape "$backend_script_update")","frontendScriptUpdate":"$(json_escape "$frontend_script_update")","backendImage":"$(json_escape "$backend_image")","frontendImage":"$(json_escape "$frontend_image")"},"dedupeKey":"$(json_escape "$dedupe_key")"}
EOF
)

    if curl --silent --show-error --max-time "$timeout_sec" \
        -H "Content-Type: application/json" \
        -X POST "$endpoint" \
        -d "$payload" >/dev/null; then
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Auto-update alert posted to central endpoint."
        return 0
    fi

    echo -en "[\e[1;33mWARN\e[0m] "
    echo "Failed to post auto-update alert to central endpoint."
    return 0
}

function emit_chained_auto_update_alert() {
    local frontend_exit="$1"
    local frontend_pull_state="$2"
    local alert_code severity summary

    if ! read_backend_update_state; then
        return 0
    fi

    if [[ "$BACKEND_EXIT" != "0" || "$frontend_exit" != "0" ]]; then
        alert_code="AUTO_UPDATE_FAILED"
        severity="critical"
        summary="Sender auto-update executed with failures."
    elif [[ "$BACKEND_PULL_STATE" == "no-change" && "$frontend_pull_state" == "no-change" ]]; then
        alert_code="AUTO_UPDATE_NO_CHANGE"
        severity="info"
        summary="Sender auto-update executed; no newer images were available."
    else
        alert_code="AUTO_UPDATE_EXECUTED"
        severity="info"
        summary="Sender auto-update executed successfully."
    fi

    post_auto_update_alert \
        "$alert_code" \
        "$severity" \
        "$summary" \
        "$BACKEND_EXIT" \
        "$frontend_exit" \
        "$BACKEND_PULL_STATE" \
        "$frontend_pull_state" \
        "$BACKEND_IMAGE" \
        "$IMAGE" \
        "$BACKEND_SCRIPT_UPDATE_STATE" \
        "$FRONTEND_SCRIPT_UPDATE_STATE"
    return 0
}

## INSTALL FUNCTIONS
function install_service() {
    # Check if unit-file exists
    if [[ -f "$UNIT_FILE" ]]; then
        echo -en "[  \e[32mOK\e[0m  ] "
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
          echo -en "[  \e[32mOK\e[0m  ] "
          echo "$SERVICE installed as an enabled service."
          return 0  # Success
      else
          echo -en "[\e[1;31mFAILED\e[0m] "
          echo "Something went wrong in installing $SERVICE."
          return 1  # Failure
      fi
    fi
}

function pull_container() {
    local pull_output
    local pull_exit

    pull_output="$(docker pull "$IMAGE" 2>&1)"
    pull_exit=$?
    LAST_PULL_RESULT="$(classify_pull_state_from_output "$pull_output")"
    if [[ -n "$pull_output" ]]; then
        echo "$pull_output"
    fi

    if [[ $pull_exit -eq 0 ]]; then
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Image $IMAGE pulled successfully."
        return 0
    else
        echo -en "[\e[1;31mFAILED\e[0m] "
        echo "Failed to pull image $IMAGE."
        return 1
    fi
}

function create_network() {
    if docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
        echo -en "[  \e[32mOK\e[0m  ] "
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
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Network $DOCKER_NETWORK created successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to create network $DOCKER_NETWORK."
            return 1
        fi

    fi
}

function create_container() {
    if docker inspect "$CONTAINER" >/dev/null 2>&1; then
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Container $CONTAINER already exists."
        return 0 # Success
    else
        # create container
        docker create \
            --name "$CONTAINER" \
            --volume /sys/fs/cgroup:/sys/fs/cgroup:ro \
            --net UPRI-docker-network \
            --env REACT_APP_BACKEND_PORT=5001 \
            --env NGINX_PORT=3000 \
            --publish 0.0.0.0:3000:3000 \
            --log-driver json-file \
            --log-opt max-size=10m \
            --log-opt max-file=3 \
            "$IMAGE"
            # volume: workaround for docker's oci runtime error
            # net: make sender-backend be accessible by name from frontend
            # publish: make port of host passthrough port of container

        if [[ $? -eq 0 ]]; then
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Container $CONTAINER created successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to create container $CONTAINER."
            return 1
        fi
    fi
}

function start_container() {
    if [[ $(docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null) == "true" ]]; then
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Container $CONTAINER is already running."
        return 0
    else
        docker start "$CONTAINER"
        if [[ $? -eq 0 ]]; then
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Container $CONTAINER started successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to start container $CONTAINER."
            return 1
        fi
    fi
}

function update_container() {
    stop_container
    remove_container
    pull_container || return 1
    create_network
    create_container
    start_container
}

## UNINSTALL FUNCTIONS
function stop_container() {
    if [[ $(docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null) == "true" ]]; then
        docker stop "$CONTAINER"
        if [[ $? -eq 0 ]]; then
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Container $CONTAINER stopped successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to stop container $CONTAINER."
            return 1
        fi
    else
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Container $CONTAINER is not running."
        return 0
    fi
}

function remove_container() {
    if docker inspect "$CONTAINER" >/dev/null 2>&1; then
        docker rm "$CONTAINER"
        if [[ $? -eq 0 ]]; then
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Container $CONTAINER removed successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to remove container $CONTAINER."
            return 1
        fi
    else
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Container $CONTAINER does not exist."
        return 0
    fi
}

function remove_image() {
    if docker inspect "$IMAGE" >/dev/null 2>&1; then
        docker rmi "$IMAGE"
        if [[ $? -eq 0 ]]; then
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Image $IMAGE removed successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to remove image $IMAGE."
            return 1
        fi
    else
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Image $IMAGE does not exist."
        return 0
    fi
}

function remove_network() {
    if docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
        docker network rm "$DOCKER_NETWORK"
        if [[ $? -eq 0 ]]; then
            echo -en "[  \e[32mOK\e[0m  ] "
            echo "Network $DOCKER_NETWORK removed successfully."
            return 0
        else
            echo -en "[\e[1;31mFAILED\e[0m] "
            echo "Failed to remove network $DOCKER_NETWORK."
            return 1
        fi
    else
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Network $DOCKER_NETWORK does not exist."
        return 0
    fi
}

function uninstall_service() {
    if [[ ! -f "$UNIT_FILE" ]]; then
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "Unit file $UNIT_FILE does not exist."
        return 0
    fi

    sudo systemctl --quiet stop "$SERVICE" >/dev/null 2>&1
    if [[ $? -eq 1 ]]; then
        echo -en "[\e[1;31mFAILED\e[0m] "
        echo "Failed to stop service $UNIT_FILE."
        return 1
    fi

    sudo systemctl --quiet disable "$SERVICE" >/dev/null 2>&1
    if [[ $? -eq 1 ]]; then
        echo -en "[\e[1;31mFAILED\e[0m] "
        echo "Failed to disable service $UNIT_FILE."
        return 1
    fi

    sudo rm "$UNIT_FILE"
    if [[ $? -eq 0 ]]; then
        echo -en "[  \e[32mOK\e[0m  ] "
        echo "$SERVICE uninstalled successfully."
        return 0
    else
        echo -en "[\e[1;31mFAILED\e[0m] "
        echo "Failed to remove unit file $UNIT_FILE."
        return 1
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
    "UPDATE")
        LAST_PULL_RESULT="unknown"
        update_container
        update_exit=$?
        frontend_pull_state="$LAST_PULL_RESULT"
        emit_chained_auto_update_alert "$update_exit" "$frontend_pull_state"
        exit "$update_exit"
        ;;
    "STOP")
        stop_container
        ;;
    "REMOVE_CONTAINER")
        remove_container
        ;;
    "REMOVE_IMAGE")
        remove_image
        ;;
    "REMOVE_NETWORK")
        remove_network
        ;;
    "UNINSTALL_SERVICE")
        uninstall_service
        ;;
    *)
        echo "Invalid argument. Usage: ./script.sh [INSTALL_SERVICE|NETWORK_SETUP|PULL|CREATE|START|STOP|UPDATE|REMOVE_NETWORK|REMOVE_IMAGE|REMOVE_CONTAINER|UNINSTALL_SERVICE]"
        ;;
esac
