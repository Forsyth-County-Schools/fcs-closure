'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Game } from '@/lib/games';
import { Star, Users, Trophy } from 'lucide-react';

interface GameCardProps {
  game: Game;
  index?: number;
}

/**
 * GameCard Component
 * 
 * Displays a single game card with thumbnail, title, description, and metadata.
 * Used in the game grid on the homepage and category pages.
 */
export default function GameCard({ game, index = 0 }: GameCardProps) {
  const difficultyColor = {
    easy: 'text-green-400 bg-green-500/20 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    hard: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <Link href={`/game/${game.id}`}>
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-cyan-500/50 transition-all duration-300">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
            {/* Placeholder for game thumbnail */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-50">
                {game.category === 'puzzle' && '🧩'}
                {game.category === 'arcade' && '🕹️'}
                {game.category === 'strategy' && '♟️'}
                {game.category === 'educational' && '📚'}
              </div>
            </div>
            
            {/* Featured Badge */}
            {game.featured && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              {game.title}
            </h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {game.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Difficulty Badge */}
              {game.difficulty && (
                <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${difficultyColor[game.difficulty]}`}>
                  <Trophy className="w-3 h-3 inline mr-1" />
                  {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                </div>
              )}

              {/* Players Badge */}
              {game.players && (
                <div className="px-3 py-1 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/20 border border-cyan-500/30">
                  <Users className="w-3 h-3 inline mr-1" />
                  {game.players} {game.players === '1' ? 'Player' : 'Players'}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>
      </Link>
    </motion.div>
  );
}
