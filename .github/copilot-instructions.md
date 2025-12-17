<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Music League Statistics Project

This is a React application built with Vite that displays statistics and leaderboards for Music League competitions.

## Project Overview

- Framework: React 18 with Vite 5
- Purpose: Display Music League competition statistics from CSV data
- Main features: Leaderboard, points calculation, statistics overview

## Data Structure

The application uses four CSV files located in `/public/assets/`:

- `competitors.csv`: Competitor IDs and names
- `rounds.csv`: Round information
- `submissions.csv`: Song submissions per round
- `votes.csv`: Voting records with points assigned

## Development Guidelines

- Keep components simple and functional
- CSV parsing is done client-side in the App component
- Points are calculated by matching votes to submissions via Spotify URIs
- Use the existing color scheme (blue #646cff for accents)
- Maintain responsive design for mobile and desktop
