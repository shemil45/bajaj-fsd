# SRM BFHL Challenge

Next.js 16 + TypeScript + Tailwind CSS implementation of the SRM Full Stack Engineering Challenge.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Environment

Copy `.env.example` to `.env` and replace the placeholder identity values before deployment.

## API

`POST /bfhl`

```json
{
  "data": ["A->B", "B->C", "D->E"]
}
```

The response includes identity fields, processed hierarchies, invalid entries, duplicate edges, and summary stats.
