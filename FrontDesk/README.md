# Passport Management Admin Desktop App

This is an Electron-based desktop application for passport processing administration. It provides a user-friendly interface for administrators to monitor processed passports, view statistics, modify passport details, delete processed passports, and access historical data.

## Features

- **Dashboard** - View key statistics and performance metrics
- **Passport Management** - Edit and delete passport entries
- **Worker Monitoring** - View worker performance and processed passports
- **History** - Access historical data of processed passports
- **Authentication** - Secure login system for administrators

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

### Quick Start

For Windows users, simply run the `install.bat` script to install dependencies and start the application:

```
.\install.bat
```

### Manual Installation

1. Install dependencies:

```
npm install
```

2. Run the development environment:

```
npm run dev
```

## Building for Production

To build the application for distribution:

```
npm run build
npm run package
```

This will create executable files in the `release` directory.

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `contexts/` - React contexts for state management
  - `services/` - API and utility services
  - `main.ts` - Electron main process
  - `preload.ts` - Electron preload script
  - `renderer.tsx` - React renderer process
- `dist/` - Compiled JavaScript files
- `release/` - Built application packages

## Configuration

The application connects to a backend API running on `http://localhost:3001` by default. If you need to change this, modify the `BASE_URL` in `src/services/api.ts`.

## Tech Stack

- Electron - Desktop application framework
- React - UI library
- TypeScript - Type-safe JavaScript
- Tailwind CSS - Utility-first CSS framework
- Recharts - Charting library
- Axios - HTTP client

## License

ISC 