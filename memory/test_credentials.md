# Test Credentials

Seeded automatically on backend startup if the `users` collection is empty
(or if the seed values differ). Backend file: `/app/backend/scripts/seed.js`.

| role   | email                | password   |
| ------ | -------------------- | ---------- |
| admin  | admin@example.com    | admin123   |
| member | member@example.com   | member123  |

API base for the preview pod:
`https://a709cb7c-d0ce-48fd-8a8b-353c6ee978e1.preview.emergentagent.com/api`

Login:
```bash
curl -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'
```
