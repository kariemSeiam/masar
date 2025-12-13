# مسار | MASAR

رفيق رحلاتك الميدانية - تطبيق إدارة الزيارات للمندوبين

Field journey companion - Visit management app for representatives

## 🌟 Features

- 🗺️ **Interactive Map View** - Visualize places on an interactive map with filtering capabilities
- 📍 **Place Management** - Manage and track places (pharmacies, stores, restaurants, etc.)
- 🚗 **Journey Planning** - Plan and organize field visits efficiently
- ✅ **Visit Tracking** - Track visit status (new, visited, postponed, closed)
- 📊 **History & Analytics** - View visit history and statistics
- 🎯 **Location Filtering** - Filter by governorates, cities, radius, and place types
- 📱 **Mobile-First Design** - Optimized for mobile field work

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Maps**: Mapbox GL
- **State Management**: React Hooks
- **Forms**: React Hook Form + Zod

## 📦 Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── screens/     # Main screen components
│   └── ui/          # Reusable UI components
├── lib/             # Utilities and types
└── hooks/           # Custom React hooks
```

## 🌐 Deployment

### GitHub Pages

This project is configured for GitHub Pages deployment. The app will be available at:
`https://[username].github.io/masar`

The deployment is automated via GitHub Actions. Simply push to the `main` branch and the workflow will build and deploy automatically.

### Manual Deployment

1. Build the static export:
   ```bash
   npm run build
   ```

2. The `out` directory contains the static files ready for deployment.

## 📝 Environment Variables

For Mapbox integration, you'll need to set up your Mapbox access token. Create a `.env.local` file:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Features in Detail

### Plan Screen
- Map and list view modes
- Filter by status, location, radius, place type
- Select multiple places for journey planning
- Search and filter capabilities

### Journey Screen
- Step-by-step navigation to selected places
- Check-in functionality with outcomes
- Skip and complete journey options
- Real-time journey statistics

### History Screen
- View all past visits
- Filter by date and outcome
- Visit details and notes
- Statistics and analytics

### Data Screen
- Manage available data
- Add new places
- View data by type, city, and governorate
- Order management system

---

Made with ❤️ for field representatives
