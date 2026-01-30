'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Maximize2, RotateCcw, Home, Trophy, Users } from 'lucide-react';
import { getGameById } from '@/lib/games';
import { useState } from 'react';

/**
 * Individual Game Page
 * 
 * Displays a single game in an iframe.
 * Existing game files (HTML, JS, CSS) are loaded from /public/games/{category}/{game-id}/
 */
export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const game = getGameById(gameId);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-8">The game you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center gap-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleFullscreen = () => {
    const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const handleRefresh = () => {
    const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const difficultyColor = {
    easy: 'text-green-400 bg-green-500/20 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    hard: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center gap-2 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>

          {/* Game Info */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{game.title}</h1>
                <p className="text-gray-300 text-lg mb-4">{game.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {game.difficulty && (
                    <div className={`px-3 py-1 rounded-lg text-sm font-semibold border ${difficultyColor[game.difficulty]}`}>
                      <Trophy className="w-4 h-4 inline mr-1" />
                      {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                    </div>
                  )}
                  {game.players && (
                    <div className="px-3 py-1 rounded-lg text-sm font-semibold text-cyan-400 bg-cyan-500/20 border border-cyan-500/30">
                      <Users className="w-4 h-4 inline mr-1" />
                      {game.players} {game.players === '1' ? 'Player' : 'Players'}
                    </div>
                  )}
                  <div className="px-3 py-1 rounded-lg text-sm font-semibold text-purple-400 bg-purple-500/20 border border-purple-500/30">
                    {game.category.charAt(0).toUpperCase() + game.category.slice(1)}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center gap-2 border border-white/10"
                  title="Restart Game"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
                <button
                  onClick={handleFullscreen}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 border border-cyan-500/30"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Game Frame */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4 shadow-2xl"
        >
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
            {/* 
              This iframe loads the existing game files.
              Game files should be placed in: /public/games/{category}/{game-id}/index.html
              
              For example, if you have a snake game:
              /public/games/arcade/snake/index.html
              /public/games/arcade/snake/game.js
              /public/games/arcade/snake/style.css
            */}
            <iframe
              id="game-iframe"
              src={`${game.path}/index.html`}
              className="w-full h-full"
              title={game.title}
              allowFullScreen
              sandbox="allow-scripts allow-forms"
            />
            
            {/* Placeholder message when game file doesn't exist */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 pointer-events-none">
              <div className="text-center p-8">
                <div className="text-6xl mb-4 opacity-50">
                  {game.category === 'puzzle' && '🧩'}
                  {game.category === 'arcade' && '🕹️'}
                  {game.category === 'strategy' && '♟️'}
                  {game.category === 'educational' && '📚'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                <p className="text-gray-400">Place game files in: <code className="text-cyan-400">{game.path}/index.html</code></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
          <p className="text-gray-300 leading-relaxed">
            {game.description} This game loads from existing files and maintains all original functionality.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
