# TravelBuddy API v1

Local direct base: `http://localhost:5000/api/v1`.
Local browser/proxy base: `http://localhost:3000/api/v1`.

Only the health endpoint is implemented. No provider or database credentials are
required to run the scaffold.

## GET /health

Public liveness endpoint. It confirms the API process is responding; it does not
check database readiness or upstream providers.

Status: `200 OK`. Content type: `application/json`.

```json
{ "status": "ok", "service": "travelbuddy-api", "version": "v1" }
```

## Error envelope

```json
{ "error": { "code": "NOT_FOUND", "message": "Endpoint not found." } }
```

| HTTP status | Code | Condition |
| --- | --- | --- |
| 400 | `INVALID_JSON` | Malformed JSON request body |
| 404 | `NOT_FOUND` | Unimplemented endpoint or method |
| 413 | `PAYLOAD_TOO_LARGE` | JSON request body exceeds 100 KB |
| 500 | `INTERNAL_ERROR` | Unexpected server error; no internal details exposed |

Future auth, trip, search, and itinerary endpoints must document request/response
schemas, authentication, ownership checks, timeouts, and failure behavior before
implementation. Authentication and authorization are not implemented yet.
