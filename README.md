# Friedrich Schiller Studentenheim - Laundry Scheduler

Production-ready web app for scheduling shared laundry reservations in a student residence.

## Features

- Weekly schedule (Mon-Sun, 00:00-23:00)
- 3 machines: Washing Machine 1, Washing Machine 2, Dryer
- EN/DE language toggle and light/dark theme toggle (persisted in localStorage)
- Reservation validation and conflict prevention with PostgreSQL + Prisma

## Requirements

- Node.js 20+
- PostgreSQL database

## Setup

1. Update the database URL in `.env`.
2. Install dependencies:

```bash
npm install
```

3. Run migrations:

```bash
npx prisma migrate dev --name init
```

4. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Prisma

- Schema: `prisma/schema.prisma`
- Client output: `src/generated/prisma`

Useful commands:

```bash
npx prisma studio
npx prisma generate
```
