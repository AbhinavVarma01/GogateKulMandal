import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const PresidentsThoughtsPage = () => {
  const [showVideo, setShowVideo] = useState(false);

  const handleVideoClick = () => {
    setShowVideo(true);
  };

  const closeVideo = () => {
    setShowVideo(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-pink-50 to-amber-100">
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-2 w-full">
        <div className="w-full flex justify-end max-w-2xl mb-6">
          <Link
            to="/dashboard"
            className="inline-block px-7 py-2 bg-amber-500 text-white font-semibold rounded-full shadow hover:bg-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 animate-bounce-in"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex flex-col items-center w-full max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-amber-700">अध्यक्षांचे मनोगत</h2>
          <div className="w-full flex justify-center">
            <div 
              className="w-full max-w-xl aspect-video bg-gray-200 border-4 border-pink-300 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={handleVideoClick}
            >
              <div className="relative w-full h-full">
                <img 
                  src="/Presidents_thoughts.jpg" 
                  alt="Presidents Thoughts" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-white text-lg font-semibold">Click to view Presidents Thoughts Video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-amber-700">President's Thoughts</h1>
            <p className="mb-6 text-lg text-gray-700">Read inspiring messages and reflections from the President of the Kulvruttant Samiti. These thoughts guide the family towards unity, progress, and the preservation of our rich heritage.</p>
            <ul className="list-disc pl-6 text-gray-800 mb-8">
              <li>Messages on family values and unity</li>
              <li>Reflections on cultural heritage</li>
              <li>Guidance for the younger generation</li>
              <li>Vision for the future of the family</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-amber-900 font-semibold">For more messages, visit the President's section or contact the Samiti.</p>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={closeVideo}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/kNBR41iA2Io?autoplay=1"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PresidentsThoughtsPage;
