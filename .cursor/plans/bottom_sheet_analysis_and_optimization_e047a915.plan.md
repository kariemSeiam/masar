---
name: Bottom Sheet Analysis and Optimization
overview: Comprehensive analysis and optimization of all bottom sheet implementations in the codebase, including creating a unified, high-performance bottom sheet component with proper drag gestures, snap points, accessibility, and performance optimizations.
todos:

- id: todo-1765461069934-x6xk5301k
content: ""
status: pending
---

# Bottom Sheet Deep Analysis & Optimization Plan

## Current State Analysis

### Existing Implementations

1. **CheckInModal** (`src/components/CheckInModal.tsx`)

- Uses framer-motion drag gestures
- Has expand/collapse functionality
- Uses `useMotionValue` for drag tracking
- Registers with bottom sheet context
- Issues: Content height calculation in useEffect, no snap points, no scroll locking

2. **PlanScreen Bottom Sheet** (`src/components/screens/PlanScreen.tsx`)

- Simple bottom sheet without drag gestures
- Uses framer-motion for animations only
- Registers with bottom sheet context
- Issues: No drag support, static height, no snap points

3. **JourneyScreen Bottom Sheet** (`src/components/screens/JourneyScreen.tsx`)

- Has draggable bottom sheet with collapse/expand
- Uses `useMotionValue` for drag tracking
- Issues: Doesn't use bottom sheet context, complex height calculations, no snap points

4. **Sheet Component** (`src/components/ui/sheet.tsx`)

- Uses Radix UI Dialog primitive
- CSS-based animations
- Supports multiple sides (top, right, bottom, left)
- Issues: No drag gestures, diffe