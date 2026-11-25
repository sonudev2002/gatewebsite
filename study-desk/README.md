# GATE Study Desk

Run `npm run dev` with Node 22.13 or newer from this directory. The local server listens on 127.0.0.1:5173 and writes to a development SQLite database. Set PORT or STUDY_LOCAL_DB to override those defaults.

The web directory holds the interface, practice questions, PYQ archive, and math renderer. The worker API uses the hosting platform’s authenticated user ID. Only deploy it behind a gateway that strips client-supplied identity headers and supplies a verified identity. The hosted app uses a D1 binding named DB and the schema in drizzle. Build the Worker with `npm run build`.

The question studio uses the gatewebsite subject, topic, subtopic, and microtopic hierarchy. The original React and FastAPI application can continue using its own MySQL data. No MySQL export is bundled.
