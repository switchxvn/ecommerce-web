#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing .env at ${ENV_FILE}" >&2
  exit 1
fi

while IFS= read -r line || [[ -n "${line}" ]]; do
  [[ "${line}" =~ ^[[:space:]]*# ]] && continue
  [[ "${line}" =~ ^[[:space:]]*$ ]] && continue
  [[ "${line}" != *=* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"
  value="${value%$'\r'}"

  if [[ ${#value} -ge 2 && "${value}" == \"*\" && "${value}" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ ${#value} -ge 2 && "${value}" == \'*\' && "${value}" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi

  export "${key}=${value}"
done < "${ENV_FILE}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  exec psql "${DATABASE_URL}" "$@"
fi

: "${DB_HOST:?Missing DB_HOST in .env}"
: "${DB_PORT:=5432}"
: "${DB_USERNAME:?Missing DB_USERNAME in .env}"
: "${DB_DATABASE:?Missing DB_DATABASE in .env}"
: "${DB_PASSWORD:?Missing DB_PASSWORD in .env}"

export PGPASSWORD="${DB_PASSWORD}"
exec psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" "$@"
