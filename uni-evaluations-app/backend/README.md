# Backend-Placeholder

Dieses Backend ist derzeit nur ein schlanker Express-Server ohne DB-Verbindung.
Das Frontend greift direkt per `@supabase/supabase-js` (HTTPS) auf Supabase zu.

## Wofür trotzdem nützlich?
- Später: serverseitige Jobs, Webhooks, Reporting, Admin-Tasks
- Sichere Server-Secrets (Service Role Key), falls benötigt
- Proxy für spezielle Endpunkte

## Start
npm install
npm run dev
