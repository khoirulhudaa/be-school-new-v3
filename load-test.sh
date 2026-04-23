#!/bin/bash

# =============================================
# load-test.sh — Autocannon Load Test Runner
# KiraProject Presensi QR - /scan-qr/double-qr
# =============================================

# --- Konfigurasi ---
HOST="http://localhost:5005"
ENDPOINT="/scan-qr/double-qr"
CONNECTIONS=10
DURATION=20
SCHOOL_ID=1
USER_ID=1
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9maWxlIjp7ImlkIjoxLCJzY2hvb2xJZCI6MSwibmFtZSI6IlNpc3dhIFRlc3QgMSIsInBhcmVudElkIjpudWxsLCJuaXMiOiJOSVMwMDAwMDEiLCJuaXNuIjpudWxsLCJuaWsiOm51bGwsImdlbmRlciI6bnVsbCwiYmlydGhQbGFjZSI6bnVsbCwiYmlydGhEYXRlIjpudWxsLCJjbGFzcyI6IlhJSSBSUEwiLCJiYXRjaCI6IjIwMjUiLCJwaG90b1VybCI6bnVsbCwicXJDb2RlRGF0YSI6bnVsbCwiaXNBY3RpdmUiOnRydWUsImlzR3JhZHVhdGVkIjpmYWxzZSwiZ3JhZHVhdGlvbk5vdGUiOm51bGwsImV4YW1OdW1iZXIiOm51bGwsImVtYWlsIjoic2lzd2ExQGdtYWlsLmNvbSIsInJvbGUiOiJzaXN3YSIsInNjaG9vbExvY2F0aW9uIjp7ImxhdCI6bnVsbCwibG5nIjpudWxsLCJyYWRpdXNNZXRlciI6MjAwfX0sImlhdCI6MTc3NTE5NTE3NSwiZXhwIjoxNzc1MjgxNTc1fQ.ddFkoQQzaUN1mnn0nEfg5U2iQTf7SbAyX0Udj_GU4dg"
PAYLOAD='{"qrCodeData":"SCHOOL_QR_1_LEFT","userLat":-6.9175,"userLon":107.6191}'

TODAY=$(date +%Y-%m-%d)
REDIS_KEY="absensi_check:${SCHOOL_ID}:${USER_ID}:${TODAY}"

# --- Warna Output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}  KiraProject Load Test — double-qr endpoint ${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""

# --- Step 1: Cek autocannon ---
if ! command -v autocannon &> /dev/null; then
  echo -e "${RED}[ERROR] autocannon tidak ditemukan.${NC}"
  echo -e "Install dulu: ${YELLOW}npm install -g autocannon${NC}"
  exit 1
fi

# --- Step 2: Flush Redis lock ---
echo -e "${YELLOW}[1/3] Flushing Redis lock...${NC}"
echo -e "      Key: ${REDIS_KEY}"

DEL_RESULT=$("/c/laragon/bin/redis/redis-x64-5.0.14.1/redis-cli.exe" DEL "$REDIS_KEY" 2>&1)

if [[ $? -ne 0 ]]; then
  echo -e "${RED}[ERROR] Gagal koneksi ke Redis: ${DEL_RESULT}${NC}"
  echo -e "Pastikan Redis berjalan: ${YELLOW}redis-server${NC}"
  exit 1
fi

if [[ "$DEL_RESULT" == "1" ]]; then
  echo -e "${GREEN}      Redis key dihapus.${NC}"
else
  echo -e "${GREEN}      Redis key tidak ada (fresh start).${NC}"
fi

echo ""

# --- Step 3: Cek server ---
echo -e "${YELLOW}[2/3] Mengecek server...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HOST")

if [[ "$HTTP_STATUS" == "000" ]]; then
  echo -e "${RED}[ERROR] Server tidak merespons di ${HOST}${NC}"
  echo -e "Pastikan server berjalan: ${YELLOW}npm run dev${NC}"
  exit 1
fi

echo -e "${GREEN}      Server OK (HTTP ${HTTP_STATUS})${NC}"
echo ""

# --- Step 4: Jalankan autocannon ---
echo -e "${YELLOW}[3/3] Menjalankan load test...${NC}"
echo -e "      Target  : ${HOST}${ENDPOINT}"
echo -e "      Koneksi : ${CONNECTIONS} concurrent"
echo -e "      Durasi  : ${DURATION} detik"
echo ""

autocannon \
  -c "$CONNECTIONS" \
  -d "$DURATION" \
  -m POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -b "$PAYLOAD" \
  "${HOST}${ENDPOINT}"

echo ""
echo -e "${CYAN}=============================================${NC}"
echo -e "${GREEN}  Test selesai.${NC}"
echo -e "${CYAN}=============================================${NC}"