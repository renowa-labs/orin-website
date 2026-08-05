# Orriii marketing website

The marketing site for Orriii, a mobile orienteering app by Renowa Labs. It is
built with Next.js and deployed to Vercel.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: create the Vercel production build
- `npm start`: run the production build locally
- `npm test`: build and run the site checks

## Vercel environment variables

Copy the variables from `.env.example` into the Vercel project settings. In
particular, configure the Brevo SMTP variables and Turnstile keys for
`orriii.renowa-labs.com`.
