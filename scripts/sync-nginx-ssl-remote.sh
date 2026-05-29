#!/bin/bash

set -euo pipefail

required_vars=(
  DEPLOY_HOST
  DEPLOY_USER
  DEPLOY_SSH_KEY
  CF_ORIGIN_CERT
  CF_ORIGIN_KEY
)

missing=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ "${#missing[@]}" -ne 0 ]; then
  echo "Missing required environment variables: ${missing[*]}" >&2
  exit 1
fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"
KNOWN_HOSTS="${DEPLOY_KNOWN_HOSTS:-}"
REMOTE_SSL_DIR="${REMOTE_SSL_DIR:-/etc/nginx/ssl}"

tmp_dir="$(mktemp -d)"
ssh_key_file="$tmp_dir/deploy_key"
known_hosts_file="$tmp_dir/known_hosts"
local_ssl_dir="$tmp_dir/ssl"
remote_tmp_dir="/tmp/mga-nginx-ssl-$$"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

mkdir -p "$local_ssl_dir"

printf '%s\n' "$DEPLOY_SSH_KEY" > "$ssh_key_file"
chmod 600 "$ssh_key_file"

if [ -n "$KNOWN_HOSTS" ]; then
  printf '%s\n' "$KNOWN_HOSTS" > "$known_hosts_file"
else
  ssh-keyscan -p "$DEPLOY_PORT" "$DEPLOY_HOST" > "$known_hosts_file" 2>/dev/null
fi
chmod 600 "$known_hosts_file"

printf '%s' "$CF_ORIGIN_CERT" > "$local_ssl_dir/fullchain.pem"
printf '%s' "$CF_ORIGIN_KEY" > "$local_ssl_dir/cloudflare-key.pem"
chmod 600 "$local_ssl_dir/fullchain.pem" "$local_ssl_dir/cloudflare-key.pem"

ssh_opts=(
  -i "$ssh_key_file"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o UserKnownHostsFile="$known_hosts_file"
  -p "$DEPLOY_PORT"
)

echo "Preparing remote SSL directory on $DEPLOY_HOST..."
ssh "${ssh_opts[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf '$remote_tmp_dir' && mkdir -p '$remote_tmp_dir'"

echo "Uploading nginx SSL files..."
scp "${ssh_opts[@]}" "$local_ssl_dir/fullchain.pem" "$local_ssl_dir/cloudflare-key.pem" \
  "$DEPLOY_USER@$DEPLOY_HOST:$remote_tmp_dir/"

echo "Installing nginx SSL files into $REMOTE_SSL_DIR..."
ssh "${ssh_opts[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "\
  sudo install -d -m 700 '$REMOTE_SSL_DIR' && \
  sudo install -m 600 '$remote_tmp_dir/fullchain.pem' '$REMOTE_SSL_DIR/fullchain.pem' && \
  sudo install -m 600 '$remote_tmp_dir/cloudflare-key.pem' '$REMOTE_SSL_DIR/cloudflare-key.pem' && \
  rm -rf '$remote_tmp_dir'"

echo "Remote SSL sync completed successfully."
