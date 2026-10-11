#!/usr/bin/env bash
set -euo pipefail

BASE="${MTAAFIX_API:-http://localhost:4000/api}"
ADMIN_EMAIL="${MTAAFIX_ADMIN_EMAIL:-admin@mtaafix.test}"
ADMIN_PASSWORD="${MTAAFIX_ADMIN_PASSWORD:-Admin1234}"
PROVIDER_EMAIL="${MTAAFIX_PROVIDER_EMAIL:-electrical@mtaafix.test}"
PROVIDER_PASSWORD="${MTAAFIX_PROVIDER_PASSWORD:-Electrical1234}"

echo "[1/9] API health"
curl -fsS "$BASE/health" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True'
echo "  OK"

echo "[2/9] Public categories"
curl -fsS "$BASE/categories" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert len(d.get("data",[])) >= 6, "expected at least six active categories"'
echo "  OK"

echo "[3/9] Problem-type routing coverage"
curl -fsS "$BASE/problem-types" | python3 -c 'import sys,json; d=json.load(sys.stdin); rows=d.get("data",[]); assert d.get("success") is True; assert len(rows) >= 20, "expected at least 20 active problem types"; missing=[r.get("name") for r in rows if not r.get("authority_id")]; assert not missing, "unrouted active problem types: "+", ".join(missing)'
echo "  OK"

login_json() {
  local identifier="$1"
  local password="$2"
  curl -fsS -X POST "$BASE/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"identifier\":\"$identifier\",\"password\":\"$password\"}"
}

echo "[4/9] Super Admin login"
ADMIN_JSON="$(login_json "$ADMIN_EMAIL" "$ADMIN_PASSWORD")"
ADMIN_TOKEN="$(printf '%s' "$ADMIN_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["user"]["role"]=="super_admin"; print(d["token"])')"
test -n "$ADMIN_TOKEN"
echo "  OK"

echo "[5/9] Super Admin incident register"
curl -fsS "$BASE/incidents" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert "stats" in d'
echo "  OK"

echo "[6/9] Analytics summary"
curl -fsS "$BASE/analytics/summary" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); x=d.get("data",{}); assert d.get("success") is True; assert all(k in x for k in ("overview","categories","priorities","trend","hotspots","departments"))'
echo "  OK"

echo "[7/9] Department login"
PROVIDER_JSON="$(login_json "$PROVIDER_EMAIL" "$PROVIDER_PASSWORD")"
PROVIDER_TOKEN="$(printf '%s' "$PROVIDER_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["user"]["role"]=="service_provider"; assert d["user"].get("authorityId") or d["user"].get("authority_id"); print(d["token"])')"
test -n "$PROVIDER_TOKEN"
echo "  OK"

echo "[8/9] Department isolation + analytics"
curl -fsS "$BASE/incidents" -H "Authorization: Bearer $PROVIDER_TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True'
curl -fsS "$BASE/analytics/summary" -H "Authorization: Bearer $PROVIDER_TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert d.get("data",{}).get("departments",[]) == []'
echo "  OK"

echo "[9/9] Notification endpoint"
curl -fsS "$BASE/notifications" -H "Authorization: Bearer $PROVIDER_TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True'
echo "  OK"

echo
echo "MtaaFix V10 API completion checks passed."
