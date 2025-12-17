# 🎵 Music League Statistics

A React web application built with Vite to display and analyze Music League competition statistics.

## Features

- **Leaderboard**: View all competitors ranked by total points
- **Statistics Overview**: See total rounds, votes, and competitor count
- **Real-time Data**: Loads data from CSV files containing competition results

## Project Structure

```
musicleaguestats/
├── public/
│   └── assets/          # CSV data files
│       ├── competitors.csv
│       ├── rounds.csv
│       ├── submissions.csv
│       └── votes.csv
├── src/
│   ├── App.jsx         # Main application component
│   ├── App.css         # Application styles
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Data Files

The application reads from four CSV files in the `/public/assets/` directory:

- **competitors.csv**: List of all competitors with their IDs and names
- **rounds.csv**: Information about each competition round
- **submissions.csv**: Song submissions for each round
- **votes.csv**: Voting data showing which competitors voted for which submissions

## How Points Are Calculated

Points are calculated by:

1. Matching votes to submissions via Spotify URI
2. Finding the submitter of each voted song
3. Summing all points assigned to each competitor's submissions
4. Ranking competitors by total points

## Technology Stack

- **React 18**: UI library
- **Vite 5**: Build tool and dev server
- **ESLint**: Code linting

## License

This project is for personal use.
