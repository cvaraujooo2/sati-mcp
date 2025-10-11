#!/usr/bin/env bash
# SATI MCP - Script agregador de testes de integração (modelo → tools → UI)
# Executa:
# 1) Dev server (Next.js) em background
# 2) Testes de integração SSE (Vitest, ambiente node)
# 3) Testes de UI (RTL/jsdom)
# 4) Encerra servidor e sumariza resultados
#
# Pré-requisitos:
# - API key OpenAI configurada para o userId de DEV
# - Supabase acessível se necessário (para tools que escrevem/leem)
#
# Referências:
# - Endpoint health: GET /api/chat (ver [GET()](src/app/api/chat/route.ts:849))
# - Eventos SSE emitidos: ver [sendSseEvent()](src/app/api/chat/route.ts:172) e [createMultiStepStreamingResponse()](src/app/api/chat/route.ts:596)

set -euo pipefail

ROOT_DIR="$(pwd)"
LOG_DIR="${ROOT_DIR}/.tmp"
mkdir -p "${LOG_DIR}"

DEV_LOG="${LOG_DIR}/dev-server.log"
SUMMARY_LOG="${LOG_DIR}/test-summary.log"

echo "== SATI MCP - Test Aggregator ==" | tee "${SUMMARY_LOG}"
echo "Workspace: ${ROOT_DIR}" | tee -a "${SUMMARY_LOG}"
echo "Logs: ${DEV_LOG}, ${SUMMARY_LOG}" | tee -a "${SUMMARY_LOG}"

# 1) Iniciar dev server em background
echo "[1/4] Starting dev server (npm run dev)..." | tee -a "${SUMMARY_LOG}"
npm run dev > "${DEV_LOG}" 2>&1 &
SERVER_PID=$!

cleanup() {
  echo "[CLEANUP] Stopping dev server (PID=${SERVER_PID})..." | tee -a "${SUMMARY_LOG}"
  if ps -p "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    sleep 1
    if ps -p "${SERVER_PID}" >/dev/null 2>&1; then
      echo "[CLEANUP] Force kill..." | tee -a "${SUMMARY_LOG}"
      kill -9 "${SERVER_PID}" >/dev/null 2>&1 || true
    fi
  fi
}
trap cleanup EXIT

# 2) Aguardar servidor subir
echo "[2/4] Waiting for server to be ready on http://localhost:3000 ..." | tee -a "${SUMMARY_LOG}"
MAX_WAIT=90
COUNT=0
until curl -sSf "http://localhost:3000/api/chat" >/dev/null 2>&1; do
  sleep 1
  COUNT=$((COUNT + 1))
  if [ "${COUNT}" -ge "${MAX_WAIT}" ]; then
    echo "ERROR: Server did not become ready within ${MAX_WAIT}s" | tee -a "${SUMMARY_LOG}"
    echo "Last 100 lines of dev server log:" | tee -a "${SUMMARY_LOG}"
    tail -n 100 "${DEV_LOG}" | tee -a "${SUMMARY_LOG}"
    exit 1
  fi
done
echo "Server ready." | tee -a "${SUMMARY_LOG}"

EXIT_CODE=0

# 3) Executar testes de integração SSE
echo "[3/4] Running integration tests (SSE)..." | tee -a "${SUMMARY_LOG}"
if ! npm run test:integration; then
  echo "Integration tests failed." | tee -a "${SUMMARY_LOG}"
  EXIT_CODE=1
fi

# 4) Executar testes de UI (RTL/jsdom)
echo "[4/4] Running UI tests (RTL/jsdom)..." | tee -a "${SUMMARY_LOG}"
if ! npm run test:ui:run; then
  echo "UI tests failed." | tee -a "${SUMMARY_LOG}"
  EXIT_CODE=1
fi

# Sumarização
if [ "${EXIT_CODE}" -eq 0 ]; then
  echo "== SUCCESS: All tests passed ==" | tee -a "${SUMMARY_LOG}"
else
  echo "== FAILURE: Some tests failed ==" | tee -a "${SUMMARY_LOG}"
  echo "Dev server log preview:" | tee -a "${SUMMARY_LOG}"
  tail -n 50 "${DEV_LOG}" | tee -a "${SUMMARY_LOG}"
fi

exit "${EXIT_CODE}"