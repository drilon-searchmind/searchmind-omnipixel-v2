# Design System

A clean, minimalistic design system built with shadcn/ui and Tailwind CSS v4.

## Overview

This design system provides a consistent foundation for building UI components across the application. It uses:

- **shadcn/ui** - Copy-paste component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Design tokens** - Centralized design values

## Design Tokens

### Colors

The color system uses HSL values with CSS variables for easy theming.

#### Light Mode
- `background` - Main background color
- `foreground` - Main text color
- `primary` - Primary action color
- `secondary` - Secondary action color
- `muted` - Muted text/background
- `accent` - Accent color for highlights
- `destructive` - Error/danger states
- `border` - Border color
- `input` - Input border color
- `ring` - Focus ring color

#### Dark Mode
Automatically switches based on user preference. All colors are inverted for optimal contrast.

### Spacing

Use Tailwind's spacing scale:
- `xs` - 0.5rem (8px)
- `sm` - 0.75rem (12px)
- `md` - 1rem (16px)
- `lg` - 1.5rem (24px)
- `xl` - 2rem (32px)

### Border Radius

- Default: `0.5rem` (8px)
- Use `rounded-sm`, `rounded-md`, `rounded-lg` for variations

### Typography

- **Sans**: Geist Sans (default)
- **Mono**: Geist Mono (for code)

Font sizes follow Tailwind's type scale:
- `text-sm` - 0.875rem
- `text-base` - 1rem (default)
- `text-lg` - 1.125rem
- `text-xl` - 1.25rem
- `text-2xl` - 1.5rem

## Components

### Button

Primary interactive element with multiple variants and sizes.

**Location**: `src/components/ui/button.jsx`

**Variants**:
- `default` - Primary button (default)
- `destructive` - For dangerous actions
- `outline` - Outlined button
- `secondary` - Secondary action
- `ghost` - Minimal button
- `link` - Link-style button

**Sizes**:
- `sm` - Small
- `default` - Medium (default)
- `lg` - Large
- `icon` - Square icon button

**Usage**:
```jsx
import { Button } from "@/components/ui/button";

// Default button
<Button>Click me</Button>

// Variants
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card

Container component for grouping related content.

**Location**: `src/components/ui/card.jsx`

**Sub-components**:
- `CardHeader` - Card header section
- `CardTitle` - Card title
- `CardDescription` - Card description text
- `CardContent` - Main card content
- `CardFooter` - Card footer section

**Usage**:
```jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### UrlScanner

URL scanning form component with built-in navigation and loading states.

**Location**: `src/components/url-scanner.jsx`

**Features**:
- Input validation for URLs
- Loading state management
- Automatic navigation to scan page
- Responsive design

**Usage**:
```jsx
import { UrlScanner } from "@/components/url-scanner";

// Basic usage
<UrlScanner />

// With custom submit handler
<UrlScanner onSubmit={(url) => console.log("Custom handler:", url)} />
```

## Utilities

### `cn()` Function

Utility for merging Tailwind classes with proper conflict resolution.

**Location**: `src/lib/utils.js`

**Usage**:
```jsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

## Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Components will be added to `src/components/ui/` and can be customized as needed.

## Guidelines

### Consistency

1. **Always use design tokens** - Use CSS variables and Tailwind classes instead of hardcoded values
2. **Follow component patterns** - Use existing components as templates for new ones
3. **Maintain spacing scale** - Use the defined spacing values consistently
4. **Respect color system** - Use semantic color names (primary, secondary, etc.)

### Component Structure

```
src/components/
├── ui/           # Base UI components (Button, Card, etc.)
├── patterns/     # Composite components (Header, Footer, etc.)
└── features/     # Feature-specific components
```

### Naming Conventions

- Components: PascalCase (`Button.jsx`, `Card.jsx`)
- Utilities: camelCase (`utils.js`, `helpers.js`)
- Files: kebab-case for non-components (`design-system.js`)

### Best Practices

1. **Use the `cn()` utility** for className merging
2. **Forward refs** for components that need DOM access
3. **Use variants** with `class-variance-authority` for component variations
4. **Keep components focused** - One component, one purpose
5. **Document props** - Use JSDoc comments for complex components

## Color Reference

### Primary Colors
- Primary: `hsl(var(--color-primary))`
- Primary Foreground: `hsl(var(--color-primary-foreground))`

### Semantic Colors
- Background: `hsl(var(--color-background))`
- Foreground: `hsl(var(--color-foreground))`
- Muted: `hsl(var(--color-muted))`
- Accent: `hsl(var(--color-accent))`
- Destructive: `hsl(var(--color-destructive))`

### UI Colors
- Border: `hsl(var(--color-border))`
- Input: `hsl(var(--color-input))`
- Ring: `hsl(var(--color-ring))`

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [Class Variance Authority](https://cva.style)

## Maintenance

This design system is maintained in:
- `src/app/globals.css` - Design tokens and theme
- `src/components/ui/` - Base components
- `src/lib/utils.js` - Utility functions
- `components.json` - shadcn/ui configuration

To update the design system:
1. Modify tokens in `globals.css`
2. Update components in `src/components/ui/`
3. Update this documentation
