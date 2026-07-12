# Urban Issue AI MVP

A self-contained Java 25 web app for triaging urban-area complaints from WhatsApp and public social sources.

## Features

- Normalizes incoming reports into canonical issue records
- Real AI mode via the OpenAI Responses API when `OPENAI_API_KEY` is set
- Automatic heuristic fallback when no API key is present or the AI call fails
- Operations dashboard for issue review, overrides, and trend monitoring
- In-memory storage with demo seed data

## Run

```bash
mkdir -p out
javac -d out src/com/urbanai/*.java
java -cp out com.urbanai.UrbanIssueAiServer
```

Then open [http://localhost:8080](http://localhost:8080).

## AI configuration

Set these environment variables to enable the OpenAI-backed triage engine:

```bash
export OPENAI_API_KEY=your_api_key
export OPENAI_MODEL=gpt-5-mini-2025-08-07
java -cp out com.urbanai.UrbanIssueAiServer
```

Optional:

- `OPENAI_BASE_URL` if you need a non-default API base URL

If `OPENAI_API_KEY` is not set, the app uses its built-in heuristic triage engine instead.

## API

- `GET /api/issues`
- `POST /api/reports`
- `POST /api/issues/{id}/override`
- `POST /api/issues/{id}/status`
- `GET /api/trends`
- `GET /api/departments`

`POST /api/reports` accepts `application/x-www-form-urlencoded` fields:

- `text`
- `source` as `WHATSAPP` or `SOCIAL`
- `sourceHandle`
- `area`
- `imageUrl`
- `latitude`
- `longitude`
