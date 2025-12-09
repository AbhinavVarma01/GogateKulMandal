import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import PhotoScroller from '../components/PhotoScroller';
import Footer from '../components/Footer';
import Profile from './Profile';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  Newspaper,
  Calendar,
  User,
  Clock,
  Sparkles,
  Shield,
  Star,
  X,
  LogOut,
  AlertTriangle
} from 'lucide-react';


// Small helper for accent ring without changing primary palette
const Card = ({ children, className = '' }) => (
  <div className={`relative bg-white rounded-2xl shadow-md border border-gray-200 ${className}`}>
    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
      background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(107,114,128,0.15))',
      mask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
      WebkitMask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
      padding: '1px'
    }}></div>
    <div className="relative z-10">{children}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  // User state for MongoDB user
  const [user, setUser] = useState({ firstName: 'Guest', vanshNo: null });

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        setUser({ firstName: 'Guest', vanshNo: null });
        return;
      }
      try {
        const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || window.location.origin;
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        
        // Use firstName from backend, or extract from name, or use username
        const firstName = data.firstName || 
                         (data.name ? data.name.split(' ')[0] : '') || 
                         (data.username ? data.username.split(/[_\-\d]/)[0] : '') || 
                         'User';
        const vanshNo = data?.VanshNo ?? null;
        setUser({ firstName, vanshNo });
      } catch (e) {
        console.error('Error fetching user:', e);
        setUser({ firstName: 'Guest', vanshNo: null });
      }
    }
    fetchUser();
  }, []);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [quickStats, setQuickStats] = useState([
    { title: 'Your Vansh Members', value: '—', icon: Users, tint: 'bg-orange-100 text-orange-600', chip: 'Your Vansh' },
    { title: 'Recent News', value: '—', icon: Newspaper, tint: 'bg-emerald-100 text-emerald-600', chip: '' },
    { title: 'Upcoming Events', value: '—', icon: Calendar, tint: 'bg-violet-100 text-violet-600', chip: '' },
  ]);
  const [recentNews, setRecentNews] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const vanshParam = user?.vanshNo !== undefined && user?.vanshNo !== null ? String(user.vanshNo).trim() : '';
        const [newsRes, eventsRes] = await Promise.all([
          axios.get(`${API_URL}/api/news`, { params: { limit: 10, vansh: vanshParam, _t: Date.now() } }),
          axios.get(`${API_URL}/api/events`, { params: { limit: 10, vansh: vanshParam, _t: Date.now() } })
        ]);

        const news = newsRes?.data?.data || [];
        const events = eventsRes?.data?.data || [];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentNewsCount = news.filter(n => {
          const d = n.publishDate || n.createdAt;
          return d ? new Date(d) >= sevenDaysAgo : true;
        }).length;
        const upcomingEventsCount = events.filter(e => {
          const eventDate = e.date || e.fromDate;
          return eventDate && new Date(eventDate) >= today;
        }).length;
        const vanshValue = user?.vanshNo !== undefined && user?.vanshNo !== null ? String(user.vanshNo).trim() : '';
        let vanshMembersCount = '—';
        if (vanshValue) {
          try {
            const countRes = await axios.get(`${API_URL}/api/family/members/count`, { params: { vansh: vanshValue } });
            const countData = countRes?.data?.count;
            if (typeof countData === 'number') {
              vanshMembersCount = String(countData);
            } else if (countData !== undefined && countData !== null) {
              vanshMembersCount = String(countData);
            }
          } catch (countErr) {
            console.error('Vansh count fetch error:', countErr);
          }
        }

        setQuickStats([
          { title: 'Your Vansh Members', value: vanshMembersCount, icon: Users, tint: 'bg-orange-100 text-orange-600', chip: 'Your Vansh' },
          { title: 'Recent News', value: String(recentNewsCount), icon: Newspaper, tint: 'bg-emerald-100 text-emerald-600', chip: '' },
          { title: 'Upcoming Events', value: String(upcomingEventsCount), icon: Calendar, tint: 'bg-violet-100 text-violet-600', chip: '' },
        ]);

        setRecentNews(
          news.slice(0, 4).map(n => {
            const dateValue = n.publishDate || n.createdAt || Date.now();
            return {
              id: n._id,
              title: n.title,
              summary: n.summary || (n.content ? String(n.content).slice(0, 120) + '…' : ''),
              author: n.authorName || 'Anonymous',
              date: new Date(dateValue).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
              likes: (n.likes || []).length,
              comments: (n.comments || []).length,
            };
          })
        );
        
        setUpcomingEvents(
          events
            .filter(e => e.date || e.fromDate)
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || a.created_at || 0);
              const dateB = new Date(b.createdAt || b.created_at || 0);
              return dateB - dateA;
            })
            .slice(0, 4)
            .map(e => {
              const eventDate = e.date || e.fromDate;
              return {
                id: e._id,
                title: e.title || e.eventName,
                date: new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: [e.fromTime, e.toTime, e.time].filter(Boolean).join(' - ') || 'Time TBD',
                location: e.location || e.venue || 'TBD',
                attendees: Array.isArray(e.attendees) ? e.attendees.length : 0,
              };
            })
        );
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [API_URL, user?.vanshNo]);

  // Show loading spinner while fetching data
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
  <div className="space-y-8 xs:space-y-12" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Orange Bar with Profile and Logout */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 opacity-30" />
        <div className="relative bg-gradient-to-r from-amber-500/95 to-orange-400/95 sm:to-amber-600/90 rounded-2xl p-6 xs:p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3 tracking-wide">
              <Sparkles size={16} className="mr-2" /> Welcome back, {user?.firstName || 'User'}!
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-lg">
              {user?.firstName ? `Hi, ${user.firstName}!` : 'Welcome!'}
            </h1>
            <p className="text-amber-50/90 text-lg xs:text-xl sm:text-2xl mt-2 font-medium">
              This is your personalized family dashboard. Explore news, events, and more tailored for you.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center text-sm px-3 py-1 rounded-full bg-white/25 font-semibold">
                <Shield size={16} className="mr-2" /> Secure Space
              </div>
              <div className="inline-flex items-center text-sm px-3 py-1 rounded-full bg-white/25 font-semibold">
                <Star size={16} className="mr-2" /> Family First
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button
              className="bg-white/20 rounded-full p-3 border-2 border-white/40 hover:bg-white/30 transition"
              onClick={() => setShowProfile(true)}
              aria-label="View Profile"
            >
              <User size={36} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="bg-amber-50 border-amber-200">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 mb-1">{stat.title}</p>
                <p className="text-3xl font-extrabold text-amber-900 tracking-tight">{stat.value}</p>
                <span className="inline-flex mt-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border-amber-200 font-medium">{stat.chip}</span>
              </div>
              <div className="bg-amber-200 text-amber-700 rounded-xl p-3 shadow">
                <stat.icon size={28} className="w-7 h-7" />
              </div>
            </div>
          </Card>
        ))}
      </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Announcements & Updates */}
        <Card className="bg-amber-50 border-amber-200">
          <div className="p-6 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-900 flex items-center">
                <Newspaper className="mr-2 text-amber-600" size={24} />
                <span>Announcements & Updates</span>
              </h2>
              <Link to="/gogte-news" className="text-amber-600 hover:text-amber-800 text-sm font-semibold">View All</Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {recentNews.map((news) => (
                <div key={news.id} className="border border-amber-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-white mb-5 last:mb-0 last:border-b-0">
                  <h3 className="font-bold text-amber-900 mb-2 hover:text-amber-600 cursor-pointer text-lg">{news.title}</h3>
                  <p className="text-amber-800 text-base mb-2">{news.summary}</p>
                  <div className="flex items-center justify-between text-xs text-amber-700">
                    <div className="flex items-center space-x-4">
                      <span>By {news.author}</span>
                      <span className="flex items-center"><Clock size={14} className="mr-1" />{news.date}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="text-amber-600 hover:text-amber-800 text-base font-semibold" onClick={() => window.location.href = '/gogte-news'}>View More →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Upcoming Events (moved next to Announcements & Updates) */}
        <Card className="bg-amber-50 border-amber-200">
          <div className="p-6 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-900 flex items-center">
                <Calendar className="mr-2 text-amber-600" size={24} />
                <span>Gogate Events</span>
              </h2>
              <Link to="/gogte-events" className="text-amber-600 hover:text-amber-800 text-sm font-semibold">View All</Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border border-amber-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-white mb-5 last:mb-0 last:border-b-0">
                  <h3 className="font-bold text-amber-900 mb-2 hover:text-amber-600 cursor-pointer text-lg">{event.title}</h3>
                  <p className="text-amber-800 text-base mb-2">{event.location}</p>
                  <div className="flex items-center space-x-4 text-xs text-amber-700">
                    <span className="flex items-center"><Calendar size={14} className="mr-1" />{event.date}</span>
                    <span className="flex items-center"><Clock size={14} className="mr-1" />{event.time}</span>
                  </div>
                  <div className="mt-4">
                    <button className="text-amber-600 hover:text-amber-800 text-base font-semibold" onClick={() => window.location.href = '/gogte-events'}>View More →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>


      {/* PhotoScroller at the end */}
      <div className="mt-8">
        <PhotoScroller />
      </div>

      {/* Footer */}
      <Footer />

      {/* Profile Modal */}
      {showProfile && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowProfile(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 relative overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Gradient */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Your Profile</h2>
                  <p className="text-orange-50 text-sm">Manage your personal information</p>
                </div>
              </div>
              <button
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                onClick={() => setShowProfile(false)}
                aria-label="Close Profile"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
            
            {/* Modal Content with custom scrollbar */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 custom-scrollbar">
              <Profile />
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowLogoutModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon Header */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 px-6 py-8 flex flex-col items-center">
              <div className="p-4 bg-orange-100 rounded-full mb-4">
                <AlertTriangle className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Logout</h2>
              <p className="text-gray-600 text-center">Are you sure you want to logout from your account?</p>
            </div>
            
            {/* Action Buttons */}
            <div className="px-6 py-6 bg-gray-50 flex gap-3">
              <button
                className="flex-1 px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 shadow-sm"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                onClick={() => {
                  setShowLogoutModal(false);
                  try {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                  } catch (_) {}
                  navigate('/login', { replace: true });
                }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
  );
};

// Add custom styles for animations and scrollbar
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #fb923c, #f97316);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #f97316, #ea580c);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Dashboard;
