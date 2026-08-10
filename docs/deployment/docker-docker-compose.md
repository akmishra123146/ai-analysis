# Docker & Docker Compose Specification

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: crm_ai_db
      POSTGRES_USER: crm_admin
      POSTGRES_PASSWORD: crm_secure_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://crm_admin:crm_secure_password@postgres:5432/crm_ai_db
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

volumes:
  pgdata:
```
