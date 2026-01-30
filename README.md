# School Games Portal

A modern Next.js application providing educational games for Forsyth County Schools students. Built with React, Next.js, and Tailwind CSS featuring a dark theme and responsive design.

## Features

- **Modern UI/UX**: Clean, minimal design with dark theme (#0f0f0f background)
- **Game Categories**: Puzzle, Arcade, Strategy, and Educational games
- **Advanced Search**: Search and filter games by name, category, and difficulty
- **Responsive Design**: Works on desktop and mobile devices
- **Game Integration**: Existing games embedded via iframe
- **Offline Support**: Works offline if games are available locally
- **Smooth Animations**: Framer Motion powered transitions and effects

## Project Structure

```
src/
├── app/
│   ├── game/[id]/         # Individual game pages
│   ├── categories/        # Browse by category
│   ├── search/            # Advanced search page
│   ├── page.tsx           # Homepage with game grid
│   ├── layout.tsx         # Root layout with navbar/footer
│   └── globals.css        # Global styles with dark theme
├── components/            # Reusable components
│   ├── GameCard.tsx       # Game card component
│   ├── Navbar.tsx         # Navigation bar
│   └── Footer.tsx         # Footer component
└── lib/
    └── games.ts           # Game configuration and data

public/
└── games/                 # Game files directory
    ├── puzzle/            # Puzzle games
    ├── arcade/            # Arcade games
    ├── strategy/          # Strategy games
    └── educational/       # Educational games
```

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
npm run build
npm start
```

## Adding Games

To add a new game:

1. **Create game directory**:
   ```
   public/games/{category}/{game-id}/
   ```

2. **Add game files**:
   - Place all game files (HTML, JS, CSS, assets) in the directory
   - Main file should be named `index.html`

3. **Update game configuration**:
   - Edit `src/lib/games.ts`
   - Add game metadata (title, description, category, etc.)

Example structure:
```
public/games/arcade/snake/
├── index.html
├── game.js
├── style.css
└── thumbnail.png
```

## Design Requirements

- **Dark Background**: #0f0f0f / #111 style
- **Subtle Hover Effects**: Smooth transitions on cards and buttons
- **Modern Cards**: Rounded corners, clean spacing, gradient accents
- **Responsive**: Desktop-first, mobile-friendly layout
- **Accessibility**: Proper contrast ratios and semantic HTML

## Technical Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Game Integration

Games are loaded via iframe with the following features:

- Sandboxed environment for security
- Fullscreen support
- Game restart functionality
- Maintains existing game logic and functionality
- No modification to original game code

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deploy on Vercel

1. Push to GitHub
2. Import repository to Vercel
3. Deploy with default settings
4. Game files will be served from the public directory

## Customization

### Adding New Categories

Edit `src/lib/games.ts` and add to the `categories` array:

```typescript
{ id: 'new-category', name: 'New Category', icon: '🎯' }
```

### Changing Theme Colors

Edit `src/app/globals.css` to adjust:
- Background colors
- Accent colors
- Border colors
- Text colors

### Modifying Layout

- **Navbar**: `src/components/Navbar.tsx`
- **Footer**: `src/components/Footer.tsx`
- **Layout**: `src/app/layout.tsx`

## License

For educational use by Forsyth County Schools.

