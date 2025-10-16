# Carbon Credit Marketplace Frontend

A modern Next.js application with Tailwind CSS for the Carbon Credit Marketplace.

## Features

- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS for styling
- 📱 Responsive design
- 🔧 TypeScript support
- 🚀 Optimized for performance

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── app/
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Home page
├── components/          # Reusable components
├── lib/                 # Utility functions
├── public/              # Static assets
├── tailwind.config.js   # Tailwind configuration
├── next.config.js       # Next.js configuration
└── package.json         # Dependencies
```

## Tailwind Configuration

The project includes custom color schemes:
- Primary colors (green theme for carbon/environmental focus)
- Secondary colors (neutral grays)

## Development

The project follows TypeScript best practices and includes:
- Strict type checking
- ESLint configuration
- Path aliases (@/* for cleaner imports)
- Modern React patterns with App Router
