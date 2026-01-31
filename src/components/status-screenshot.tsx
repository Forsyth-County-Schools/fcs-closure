'use client';

import { useState } from 'react';
import { Camera, Download } from 'lucide-react';

interface ScreenshotData {
  url: string;
  filename: string;
  timestamp: number;
}

export default function StatusScreenshot() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [uploading, setUploading] = useState(false);

  // Capture screenshot of current status
  const captureScreenshot = async () => {
    try {
      setUploading(true);
      
      // Use html2canvas or similar library to capture the status
      // For now, we'll simulate with a placeholder
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas size to capture the status area
      canvas.width = 800;
      canvas.height = 600;
      
      // Create a simple screenshot (you'd use html2canvas in production)
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add status text
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText('FCS Status Monitor', 20, 30);
      ctx.fillText('Status: School is on schedule', 20, 60);
      ctx.fillText(`Captured: ${new Date().toLocaleString()}`, 20, 90);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          await uploadScreenshot(blob);
        }
      });
      
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    } finally {
      setUploading(false);
    }
  };

  // Upload screenshot to Vercel Blob
  const uploadScreenshot = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, `status-${Date.now()}.png`);
      
      const response = await fetch('/api/upload?filename=status-screenshot.png&type=status', {
        method: 'POST',
        body: blob,
      });
      
      if (response.ok) {
        const result = await response.json();
        setScreenshots(prev => [...prev, result]);
        console.log('✅ Screenshot uploaded:', result.url);
      } else {
        console.error('❌ Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
        <Camera className="w-5 h-5 text-cyan-400" />
        Status Screenshots
      </h3>
      
      <div className="space-y-4">
        {/* Capture button */}
        <button
          onClick={captureScreenshot}
          disabled={uploading}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          {uploading ? 'Capturing...' : 'Capture Screenshot'}
        </button>

        {/* Screenshots list */}
        {screenshots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Recent Screenshots:</h4>
            {screenshots.map((screenshot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded flex items-center justify-center">
                    <Camera className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      Status Screenshot
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(screenshot.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={screenshot.url}
                    download={screenshot.filename}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Usage info */}
        <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
          <p className="text-xs text-cyan-300">
            💡 Screenshots are stored in Vercel Blob Storage and can be used for:
            status history, compliance records, and incident documentation.
          </p>
        </div>
      </div>
    </div>
  );
}
