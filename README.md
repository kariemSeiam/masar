<div align="center">

# 🗺️ مسار | MASAR

**رفيق رحلاتك الميدانية** | *Your Field Journey Companion*

A modern, Arabic-first field visit management application for sales representatives and field workers.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**MASAR** (مسار - "Path" in Arabic) is a comprehensive field visit management application designed specifically for sales representatives and field workers in Egypt. The app helps users plan, execute, and track their daily field visits with an intuitive map-based interface.

### Key Highlights

- 🗺️ **Map-Centric Design** - Everything revolves around location and geography
- 🇪🇬 **Arabic-First** - Natively designed for Arabic users, not just translated
- 📱 **Mobile-Optimized** - Built for field work on mobile devices
- 🎨 **Modern UI/UX** - Beautiful, responsive interface with smooth animations
- 🌓 **Dark Mode** - Full dark mode support for comfortable use in any lighting

---

## ✨ Features

### 🗺️ Interactive Map View
- Real-time location tracking with geolocation API
- Custom markers for different place types (pharmacies, restaurants, cafes, etc.)
- Route visualization for planned journeys
- Radius-based filtering
- Dark/light map themes

### 📍 Place Management
- Add, edit, and manage places with full details
- Support for multiple place types (pharmacy, restaurant, cafe, supermarket, bakery, clinic)
- Contact information management (phone, website, Facebook)
- Status tracking (new, visited, postponed, closed, not found)
- Important places marking

### 🚗 Journey Planning
- Select multiple places for a journey
- Automatic route optimization
- Distance and time calculations
- Journey statistics tracking
- Real-time progress monitoring

### ✅ Visit Tracking
- Check-in functionality with multiple outcomes
- Visit notes and ratings
- Manual note addition
- Visit history with date filtering
- Statistics dashboard

### 📊 Data Management
- Order-based data system
- Filter by governorate, city, and place type
- Data visualization and analytics
- Export capabilities

### 🎯 Advanced Filtering
- Filter by status, location, radius, and place type
- Multi-select filters for governorates and cities
- Search functionality
- Smart filtering with available data integration

---

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15.5.7](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.0](https://react.dev/)** - UI library
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Styling & UI
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built with Radix UI
- **[Framer Motion 12.23.24](https://www.framer.com/motion/)** - Production-ready motion library
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

### Maps & Location
- **[Leaflet 1.9.4](https://leafletjs.com/)** - Open-source JavaScript library for mobile-friendly interactive maps
- **[React-Leaflet 5.0.0](https://react-leaflet.js.org/)** - React components for Leaflet maps
- **[Mapbox GL 3.17.0](https://docs.mapbox.com/mapbox-gl-js/)** - Interactive maps (optional)

### Forms & Validation
- **[React Hook Form 7.66.1](https://react-hook-form.com/)** - Performant, flexible forms
- **[Zod 4.1.12](https://zod.dev/)** - TypeScript-first schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Validation resolvers

### Date & Time
- **[date-fns 4.1.0](https://date-fns.org/)** - Modern JavaScript date utility library
- **[react-day-picker 9.11.2](https://react-day-picker.js.org/)** - Flexible date picker

### Charts & Visualization
- **[Recharts 2.15.4](https://recharts.org/)** - Composable charting library
- **[canvas-confetti 1.9.4](https://www.kirilv.com/canvas-confetti/)** - Celebration animations

### Utilities
- **[clsx](https://github.com/lukeed/clsx)** - Utility for constructing className strings
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind CSS classes
- **[class-variance-authority](https://cva.style/)** - Variant management for components
- **[cmdk](https://cmdk.paco.me/)** - Command menu component

### Additional Libraries
- **[Sonner 2.0.7](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Vaul 1.1.2](https://vaul.emilkowal.ski/)** - Drawer component
- **[Embla Carousel 8.6.0](https://www.embla-carousel.com/)** - Carousel component
- **[react-resizable-panels 3.0.6](https://github.com/bvaughn/react-resizable-panels)** - Resizable panel layouts
- **[input-otp 1.4.2](https://input-otp.vercel.app/)** - OTP input component
- **[orchids-visual-edits 1.0.12](https://www.npmjs.com/package/orchids-visual-edits)** - Visual editing tools

### Development Tools
- **[ESLint 9](https://eslint.org/)** - Code linting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript-specific linting rules
- **[Next.js ESLint Config](https://nextjs.org/docs/app/building-your-application/configuring/eslint)**

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kariemSeiam/masar.git
   cd masar
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Static Export (GitHub Pages)

```bash
# Build static export
npm run build

# Output will be in the 'out' directory
```

---

## 📁 Project Structure

```
masar/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with RTL & Cairo font
│   │   ├── page.tsx           # Main application component
│   │   └── globals.css        # Global styles & theme
│   │
│   ├── components/
│   │   ├── features/          # Feature-based components
│   │   │   ├── places/       # Place-related components
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── PlaceCard.tsx
│   │   │   │   └── PlaceDetailsSheet.tsx
│   │   │   ├── journey/      # Journey-related components
│   │   │   │   ├── CheckInModal.tsx
│   │   │   │   └── JourneyComplete.tsx
│   │   │   └── plan/         # Planning components
│   │   │       └── AddPlaceSheet.tsx
│   │   ├── layout/           # Layout components
│   │   │   └── BottomNav.tsx
│   │   ├── common/           # Shared components
│   │   │   ├── bottom-sheet.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ErrorBoundaryWrapper.tsx
│   │   ├── screens/          # Main screen components
│   │   │   ├── DataScreen.tsx
│   │   │   ├── PlanScreen.tsx
│   │   │   ├── JourneyScreen.tsx
│   │   │   └── HistoryScreen.tsx
│   │   └── ui/               # Reusable UI components (shadcn/ui)
│   │
│   ├── contexts/             # React contexts
│   │   └── BottomSheetContext.tsx
│   │
│   ├── data/                 # Mock data & static data
│   │   └── mockData.ts
│   │
│   ├── hooks/                # Custom React hooks
│   │   └── use-mobile.ts
│   │
│   ├── lib/                  # Utilities & helpers
│   │   ├── constants.ts      # Application constants
│   │   ├── utils.ts         # General utilities (cn function)
│   │   └── utils/           # Utility modules
│   │       ├── distance.ts  # Distance calculations
│   │       ├── place.ts     # Place-related utilities
│   │       └── index.ts     # Utility exports
│   │
│   └── types/               # TypeScript type definitions
│       └── index.ts
│
├── public/                   # Static assets
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies & scripts
```

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#4A90D9` | Primary actions, links, highlights |
| Success Green | `#34C759` | Visited status, success states |
| Warning Orange | `#F5A623` | Postponed status, warnings |
| Danger Red | `#FF3B30` | Not found status, errors |
| Neutral Gray | `#8E8E93` | Closed status, muted text |

### Typography

- **Font Family**: Cairo (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Direction**: RTL (Right-to-Left) for Arabic
- **Font Variable**: `--font-cairo`

### Components

- **Border Radius**: 12px (cards), 8px (buttons), full (pills)
- **Shadows**: Soft and elevated variants
- **Transitions**: 200ms ease-out
- **Glass-morphism**: Backdrop blur effects
- **Gradients**: Primary and success gradients

---

## 📱 App Screens

### 1. Data Screen (البيانات)
- View available data by type, city, and governorate
- Create and manage data orders
- Add new places to the system

### 2. Plan Screen (التجهيز)
- Interactive map view with custom markers
- List view with filtering options
- Select places for journey planning
- Advanced filtering by status, location, and type

### 3. Journey Screen (الرحلة)
- Step-by-step navigation to selected places
- Check-in functionality with outcomes
- Real-time journey statistics
- Skip and complete options

### 4. History Screen (السجل)
- View all past visits
- Filter by date and outcome
- Visit details and notes
- Statistics and analytics

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Build
npm run build:gh-pages  # Build for GitHub Pages
npm run export          # Static export
```

---

## 🌐 Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment with automatic builds.

1. Push to `main` branch
2. GitHub Actions will build and deploy automatically
3. App will be available at: `https://[username].github.io/masar`

### Manual Deployment

1. Build the static export:
   ```bash
   npm run build
   ```

2. Deploy the `out` directory to your hosting service

### Environment Variables

For production deployment, you may need to configure:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NODE_ENV=production
```

---

## 📚 Documentation

- **[MASAR_DOC.md](./MASAR_DOC.md)** - Complete application documentation
- **[MASAR_SERVER_DOC.md](./MASAR_SERVER_DOC.md)** - Server integration documentation

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👨‍💻 Author

**Kariem Seiam**

- GitHub: [@kariemSeiam](https://github.com/kariemSeiam)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [shadcn](https://twitter.com/shadcn) for the beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Leaflet](https://leafletjs.com/) for the mapping library
- All the open-source contributors whose libraries made this possible

---

<div align="center">

**Made with ❤️ for field representatives**

[⬆ Back to Top](#-مسار--masar)

</div>
