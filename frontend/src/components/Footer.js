import React from 'react';

const Footer = () => (
  <footer className="w-full bg-orange-100 border-t border-orange-300 py-4 mt-8 text-center text-gray-700 text-sm font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
      <span>© 2025 गोगटे कुलमंडळ. All rights reserved.</span>
      <span className="hidden md:inline">|</span>
      <span>Contact: <a href="mailto:gogtekulam@gmail.com" className="text-orange-700 underline hover:text-orange-900 font-medium">gogtekulam@gmail.com</a></span>
      <span className="hidden md:inline">|</span>
      <div className="flex gap-3 mt-2 md:mt-0">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-700">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 inline"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.314h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-pink-600">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 inline"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.515 2.567 5.783 2.295 7.149 2.233 8.415 2.175 8.795 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.07 5.773.127 4.802.352 3.905 1.25c-.897.897-1.123 1.868-1.18 3.147C2.013 5.668 2 6.077 2 12s.013 6.332.07 7.603c.057 1.279.283 2.25 1.18 3.147.897.897 1.868 1.123 3.147 1.18C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.07c1.279-.057 2.25-.283 3.147-1.18.897-.897 1.123-1.868 1.18-3.147C23.987 17.332 24 16.923 24 12s-.013-6.332-.07-7.603c-.057-1.279-.283-2.25-1.18-3.147-.897-.897-1.868-1.123-3.147-1.18C15.668.013 15.259 0 12 0zm0 5.838A6.162 6.162 0 0 0 5.838 12 6.162 6.162 0 0 0 12 18.162 6.162 6.162 0 0 0 18.162 12 6.162 6.162 0 0 0 12 5.838zm0 10.324A4.162 4.162 0 1 1 16.162 12 4.162 4.162 0 0 1 12 16.162zm6.406-11.845a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z"/></svg>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-blue-500">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 inline"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.384 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.928-.856 2.01-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.21-.006-.423-.016-.634A10.012 10.012 0 0 0 24 4.557z"/></svg>
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-red-600">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 inline"><path d="M23.498 6.186a2.993 2.993 0 0 0-2.108-2.121C19.534 3.5 12 3.5 12 3.5s-7.534 0-9.39.565A2.993 2.993 0 0 0 .502 6.186C0 8.042 0 12 0 12s0 3.958.502 5.814a2.993 2.993 0 0 0 2.108 2.121C4.466 20.5 12 20.5 12 20.5s7.534 0 9.39-.565a2.993 2.993 0 0 0 2.108-2.121C24 15.958 24 12 24 12s0-3.958-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
