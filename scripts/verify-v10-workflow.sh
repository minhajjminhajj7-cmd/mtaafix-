#!/usr/bin/env bash
set -euo pipefail

BASE="${MTAAFIX_API:-http://localhost:4000/api}"
ADMIN_EMAIL="${MTAAFIX_ADMIN_EMAIL:-admin@mtaafix.test}"
ADMIN_PASSWORD="${MTAAFIX_ADMIN_PASSWORD:-Admin1234}"
PROVIDER_EMAIL="${MTAAFIX_PROVIDER_EMAIL:-electrical@mtaafix.test}"
PROVIDER_PASSWORD="${MTAAFIX_PROVIDER_PASSWORD:-Electrical1234}"

TMP_DIR="$(mktemp -d)"
INCIDENT_ID=""
ADMIN_TOKEN=""
cleanup() {
  if [[ -n "$INCIDENT_ID" && -n "$ADMIN_TOKEN" ]]; then
    curl -fsS -X DELETE "$BASE/incidents/$INCIDENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Tiny valid PNG used only to exercise multipart image evidence paths.
python3 - "$TMP_DIR/evidence.png" <<'PY'
import base64,sys
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
open(sys.argv[1],'wb').write(png)
PY

login_json() {
  local identifier="$1"
  local password="$2"
  curl -fsS -X POST "$BASE/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"identifier\":\"$identifier\",\"password\":\"$password\"}"
}

echo "[1/10] Login as Super Admin"
ADMIN_JSON="$(login_json "$ADMIN_EMAIL" "$ADMIN_PASSWORD")"
ADMIN_TOKEN="$(printf '%s' "$ADMIN_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["user"]["role"]=="super_admin"; print(d["token"])')"
echo "  OK"

echo "[2/10] Login as Department"
PROVIDER_JSON="$(login_json "$PROVIDER_EMAIL" "$PROVIDER_PASSWORD")"
PROVIDER_TOKEN="$(printf '%s' "$PROVIDER_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["user"]["role"]=="service_provider"; assert d["user"].get("authorityId"); print(d["token"])')"
AUTHORITY_ID="$(printf '%s' "$PROVIDER_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["user"]["authorityId"])')"
echo "  OK (department $AUTHORITY_ID)"

echo "[3/10] Find a report type routed to this department"
TYPES_JSON="$(curl -fsS "$BASE/problem-types")"
read -r CATEGORY_ID PROBLEM_TYPE_ID PROBLEM_NAME < <(printf '%s' "$TYPES_JSON" | python3 -c '
import sys,json
rows=json.load(sys.stdin).get("data",[])
auth=str(sys.argv[1])
row=next((r for r in rows if str(r.get("authority_id"))==auth and r.get("active",True)),None)
assert row, f"No active problem type is routed to department {auth}"
print(row["category_id"], row["id"], str(row["name"]).replace(" ","_"))
' "$AUTHORITY_ID")
echo "  OK (${PROBLEM_NAME//_/ })"

echo "[4/10] Super Admin creates and auto-routes a temporary incident"
CREATE_JSON="$(curl -fsS -X POST "$BASE/incidents/manual" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"categoryId\":$CATEGORY_ID,\"problemTypeId\":$PROBLEM_TYPE_ID,\"description\":\"V10 automated workflow verification incident\",\"latitude\":-3.3869,\"longitude\":36.6830}")"
INCIDENT_ID="$(printf '%s' "$CREATE_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; x=d["data"]; assert x.get("authority_id") is not None; print(x["id"])')"
ROUTED_AUTHORITY="$(printf '%s' "$CREATE_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["authority_id"])')"
[[ "$ROUTED_AUTHORITY" == "$AUTHORITY_ID" ]] || { echo "Expected routing to $AUTHORITY_ID but got $ROUTED_AUTHORITY" >&2; exit 1; }
echo "  OK ($INCIDENT_ID)"

echo "[5/10] Department reviews the incident"
curl -fsS -X PATCH "$BASE/incidents/$INCIDENT_ID/review" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"note":"Verified by V10 workflow test"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert d["data"]["status"]=="under_review"'
echo "  OK"

echo "[6/10] Department accepts responsibility"
curl -fsS -X PATCH "$BASE/incidents/$INCIDENT_ID/accept" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert d["data"]["status"]=="assigned"'
echo "  OK"

echo "[7/10] Department starts work"
curl -fsS -X PATCH "$BASE/incidents/$INCIDENT_ID/start-work" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert d["data"]["status"]=="in_progress"'
echo "  OK"

echo "[8/10] Department uploads progress evidence"
curl -fsS -X POST "$BASE/incidents/$INCIDENT_ID/progress" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -F 'note=Automated progress evidence' \
  -F "evidence=@$TMP_DIR/evidence.png;type=image/png" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True'
echo "  OK"

echo "[9/10] Department resolves with mandatory evidence"
curl -fsS -X PATCH "$BASE/incidents/$INCIDENT_ID/resolve" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -F 'resolutionNote=Automated V10 workflow test completed successfully' \
  -F "evidence=@$TMP_DIR/evidence.png;type=image/png" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success") is True; assert d["data"]["status"]=="resolved"'
echo "  OK"

echo "[10/10] Super Admin verifies final state and evidence"
curl -fsS "$BASE/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -c '
import sys,json
d=json.load(sys.stdin); assert d.get("success") is True
x=d["data"]
assert x["incident"]["status"]=="resolved"
assert len(x.get("progressEvidence",[]))>=1
assert len(x.get("resolutionEvidence",[]))>=1
print("  OK")
'

echo
echo "MtaaFix V10 full department workflow verification passed."
echo "Temporary test incident will now be removed automatically."
