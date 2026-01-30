'use client';

import { motion } from 'framer-motion';
import { Heart, Shield, Code } from 'lucide-react';

/**
 * Footer Component
 * 
 * Footer with school information and disclaimers.
 * Maintains the dark theme with subtle styling.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About Section */}
          <div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              About
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              School-approved educational games for Forsyth County Schools students.
              All games are safe, educational, and appropriate for school use.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/categories" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="/search" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Search Games
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              Technical Info
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Built with Next.js and React. Optimized for offline use and performance.
              Works on all modern browsers.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm text-center sm:text-left">
            © {currentYear} Forsyth County Schools. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-400 fill-current" /> for students
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
