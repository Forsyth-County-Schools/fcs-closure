# Games Directory

This directory contains existing game files that will be embedded in the website.

## Structure

- `puzzle/` - Puzzle games (Sudoku, Match-3, etc.)
- `arcade/` - Arcade-style games (Snake, Pong, etc.)
- `strategy/` - Strategy games (Chess, Checkers, etc.)
- `educational/` - Educational games (Math, Typing, etc.)

## Adding Games

To add a new game:
1. Create a folder with the game name in the appropriate category
2. Place all game files (HTML, JS, CSS, assets) in that folder
3. The main file should be named `index.html`
4. Update the games configuration in `/src/lib/games.ts`

## Important

- Keep game files self-contained
- Ensure games work offline
- Games will be embedded via iframe
- Do not modify existing game logic
