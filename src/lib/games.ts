/**
 * Games Configuration
 * 
 * This file contains the configuration for all available games.
 * When adding a new game, add its metadata here.
 */

export interface Game {
  id: string;
  title: string;
  description: string;
  category: 'puzzle' | 'arcade' | 'strategy' | 'educational';
  thumbnail: string;
  path: string;
  featured?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  players?: string;
}

export const games: Game[] = [
  // Puzzle Games
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Classic number puzzle game. Fill the 9x9 grid with digits.',
    category: 'puzzle',
    thumbnail: '/games/puzzle/sudoku/thumbnail.png',
    path: '/games/puzzle/sudoku',
    featured: true,
    difficulty: 'medium',
    players: '1'
  },
  {
    id: 'match-three',
    title: 'Match Three',
    description: 'Match three or more items to clear them from the board.',
    category: 'puzzle',
    thumbnail: '/games/puzzle/match-three/thumbnail.png',
    path: '/games/puzzle/match-three',
    difficulty: 'easy',
    players: '1'
  },
  
  // Arcade Games
  {
    id: 'snake',
    title: 'Snake',
    description: 'Classic snake game. Eat food and grow without hitting walls.',
    category: 'arcade',
    thumbnail: '/games/arcade/snake/thumbnail.png',
    path: '/games/arcade/snake',
    featured: true,
    difficulty: 'easy',
    players: '1'
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'Classic paddle game. Bounce the ball past your opponent.',
    category: 'arcade',
    thumbnail: '/games/arcade/pong/thumbnail.png',
    path: '/games/arcade/pong',
    difficulty: 'easy',
    players: '1-2'
  },
  
  // Strategy Games
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic strategy board game. Checkmate your opponent.',
    category: 'strategy',
    thumbnail: '/games/strategy/chess/thumbnail.png',
    path: '/games/strategy/chess',
    featured: true,
    difficulty: 'hard',
    players: '2'
  },
  {
    id: 'checkers',
    title: 'Checkers',
    description: 'Jump over opponent pieces to capture them.',
    category: 'strategy',
    thumbnail: '/games/strategy/checkers/thumbnail.png',
    path: '/games/strategy/checkers',
    difficulty: 'medium',
    players: '2'
  },
  
  // Educational Games
  {
    id: 'math-quiz',
    title: 'Math Quiz',
    description: 'Test your math skills with timed quizzes.',
    category: 'educational',
    thumbnail: '/games/educational/math-quiz/thumbnail.png',
    path: '/games/educational/math-quiz',
    difficulty: 'medium',
    players: '1'
  },
  {
    id: 'typing-test',
    title: 'Typing Test',
    description: 'Improve your typing speed and accuracy.',
    category: 'educational',
    thumbnail: '/games/educational/typing-test/thumbnail.png',
    path: '/games/educational/typing-test',
    difficulty: 'easy',
    players: '1'
  },
];

export const categories = [
  { id: 'all', name: 'All Games', icon: '🎮' },
  { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
  { id: 'arcade', name: 'Arcade', icon: '🕹️' },
  { id: 'strategy', name: 'Strategy', icon: '♟️' },
  { id: 'educational', name: 'Educational', icon: '📚' },
] as const;

export function getGameById(id: string): Game | undefined {
  return games.find(game => game.id === id);
}

export function getGamesByCategory(category: string): Game[] {
  if (category === 'all') return games;
  return games.filter(game => game.category === category);
}

export function getFeaturedGames(): Game[] {
  return games.filter(game => game.featured);
}
