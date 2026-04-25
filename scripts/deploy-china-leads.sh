#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="$ROOT_DIR/deploy/china-leads/docker-compose.prod.yml"
EXAMPLE_ENV="$ROOT_DIR/.env.production.example"
SWAP_FILE="${DEPLOY_SWAP_FILE:-/swapfile.codex-erxes}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1"
    exit 1
  fi
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1 || true
    corepack prepare pnpm@9.12.3 --activate
    return
  fi

  echo "没有检测到 pnpm，请先安装 Node.js 22+ 并启用 corepack。"
  exit 1
}

normalize_url() {
  local value="$1"
  value="${value%/}"
  printf '%s' "$value"
}

run_privileged() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return
  fi

  echo "当前操作需要 root 或 sudo 权限: $*"
  exit 1
}

get_total_memory_mb() {
  awk '/MemTotal/ { print int($2 / 1024) }' /proc/meminfo
}

get_total_swap_mb() {
  awk '/SwapTotal/ { print int($2 / 1024) }' /proc/meminfo
}

ensure_swap() {
  local target_swap_mb="${DEPLOY_SWAP_MB:-4096}"
  local current_swap_mb

  if [[ "${DEPLOY_SKIP_SWAP:-0}" == "1" ]]; then
    echo "已跳过 swap 创建"
    return
  fi

  current_swap_mb="$(get_total_swap_mb)"

  if (( current_swap_mb >= target_swap_mb / 2 )); then
    echo "检测到现有 swap ${current_swap_mb}MB，跳过创建"
    return
  fi

  echo "低内存模式：准备创建 ${target_swap_mb}MB swap"

  if [[ ! -f "$SWAP_FILE" ]]; then
    if command -v fallocate >/dev/null 2>&1; then
      run_privileged fallocate -l "${target_swap_mb}M" "$SWAP_FILE" || {
        run_privileged dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$target_swap_mb" status=progress
      }
    else
      run_privileged dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$target_swap_mb" status=progress
    fi
  fi

  run_privileged chmod 600 "$SWAP_FILE"
  run_privileged mkswap "$SWAP_FILE" >/dev/null

  if ! swapon --show=NAME --noheadings 2>/dev/null | grep -q "^$SWAP_FILE$"; then
    run_privileged swapon "$SWAP_FILE"
  fi

  echo "swap 已启用: $SWAP_FILE"
}

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$EXAMPLE_ENV" "$ENV_FILE"
  echo "已创建 $ENV_FILE"
  echo "先把 DOMAIN 和 CHINA_LEADS_EXECUTOR_URL 改成你的服务器配置，再重新执行脚本。"
  exit 1
fi

require_command docker
ensure_pnpm
require_command node

cd "$ROOT_DIR"

set -a
source "$ENV_FILE"
set +a

if [[ -z "${DOMAIN:-}" || "${DOMAIN:-}" == "http://your-server-ip-or-domain" ]]; then
  echo "请先在 $ENV_FILE 里设置有效的 DOMAIN"
  exit 1
fi

if [[ -z "${CHINA_LEADS_EXECUTOR_URL:-}" || "${CHINA_LEADS_EXECUTOR_URL:-}" == "http://your-executor-host:4318" ]]; then
  echo "请先在 $ENV_FILE 里设置有效的 CHINA_LEADS_EXECUTOR_URL"
  exit 1
fi

DOMAIN="$(normalize_url "$DOMAIN")"
export DOMAIN
export CHINA_LEADS_UI_ENTRY_URL="${CHINA_LEADS_UI_ENTRY_URL:-$DOMAIN/plugins/china_leads_ui/remoteEntry.js}"
export REACT_APP_API_URL="${REACT_APP_API_URL:-$DOMAIN/gateway}"
export PUBLIC_HTTP_PORT="${PUBLIC_HTTP_PORT:-80}"
export DEPLOY_ENV_FILE="$ENV_FILE"

TOTAL_MEMORY_MB="$(get_total_memory_mb)"
LOW_MEMORY_MODE="${DEPLOY_LOW_MEMORY:-0}"

if [[ "$LOW_MEMORY_MODE" != "1" ]] && (( TOTAL_MEMORY_MB <= 6144 )); then
  LOW_MEMORY_MODE="1"
fi

if [[ "$LOW_MEMORY_MODE" == "1" ]]; then
  echo "检测到低内存环境 (${TOTAL_MEMORY_MB}MB)，启用低内存部署模式"
  ensure_swap
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"
  export NX_DAEMON=false
  export CI=1
  export PNPM_CHILD_CONCURRENCY="${PNPM_CHILD_CONCURRENCY:-1}"
  export npm_config_jobs="${npm_config_jobs:-1}"
  export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"
else
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
fi

compose_cmd=(
  docker compose
  --env-file "$ENV_FILE"
  -f "$COMPOSE_FILE"
)

echo "1/4 安装依赖"
pnpm install --frozen-lockfile --child-concurrency="${PNPM_CHILD_CONCURRENCY:-4}"

echo "2/4 构建后端服务"
pnpm nx run-many -t build -p core-api operation_api sales_api frontline_api china_leads_api --parallel="${NX_PARALLEL:-1}"

echo "3/4 构建并启动 Docker Compose"
"${compose_cmd[@]}" build core-api operation-api sales-api frontline-api china-leads-api gateway
"${compose_cmd[@]}" build core-ui
"${compose_cmd[@]}" build china-leads-ui
"${compose_cmd[@]}" up -d mongo redis core-api operation-api sales-api frontline-api china-leads-api gateway core-ui china-leads-ui public-nginx

echo "4/4 部署完成"
echo "访问地址: $DOMAIN"
echo "网关地址: $REACT_APP_API_URL"
echo "China Leads 前端插件地址: $CHINA_LEADS_UI_ENTRY_URL"
echo "查看日志: docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f"
