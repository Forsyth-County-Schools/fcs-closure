'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GameCard from '@/components/GameCard';
import { games, categories } from '@/lib/games';

/**
 * Categories Page
 * 
 * Browse games by category with a visual category selector.
 */
export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredGames = selectedCategory === 'all'
    ? games
    : games.filter(game => game.category === selectedCategory);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
            Browse Categories
          </h1>
          <p className="text-xl text-gray-300 font-light">
            Explore games organized by type
          </p>
        </motion.div>

        {/* Category Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12"
        >
          {categories.map((category, index) => {
            const isActive = selectedCategory === category.id;
            const count = category.id === 'all' 
              ? games.length 
              : games.filter(g => g.category === category.id).length;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={isActive}
                aria-label={`Filter by ${category.name} - ${count} ${count === 1 ? 'game' : 'games'}`}
                className={`p-6 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/30'
                    : 'bg-white/10 backdrop-blur-sm text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <div className="text-lg font-bold mb-1">{category.name}</div>
                <div className={`text-sm ${isActive ? 'text-cyan-100' : 'text-gray-400'}`}>
                  {count} {count === 1 ? 'game' : 'games'}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Games Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            {selectedCategory === 'all'
              ? 'All Games'
              : `${categories.find(c => c.id === selectedCategory)?.name} Games`}
          </h2>

          {filteredGames.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">No games found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
