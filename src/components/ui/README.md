# UI Components

This directory contains reusable UI components built with shadcn/ui.

## Available Components

- **Button** - Interactive button with multiple variants and sizes
- **Card** - Container component for grouping content

## Adding More Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

Components will be automatically added to this directory.

## Usage

Import components from `@/components/ui`:

```jsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
```

See `DESIGN_SYSTEM.md` in the project root for complete documentation.
