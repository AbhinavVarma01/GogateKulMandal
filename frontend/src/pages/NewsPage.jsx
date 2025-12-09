import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Search, Filter, Plus, X, Clock, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';
import Footer from '../components/Footer';
import SuccessToast from '../components/SuccessToast';
import LoadingSpinner from '../components/LoadingSpinner';

// Add News Modal Component
const AddNewsModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'General',
    priority: 'Medium',
    tags: '',
    authorVanshNo: '',
    authorName: '',
    images: [],
    visibleToAllVansh: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Fetch current user and auto-fill author info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          setIsLoadingUser(false);
          return;
        }

        const response = await api.get('/api/auth/me');

        const user = response.data;
        console.log('Current user:', user);
        
        // Auto-fill author fields with firstName from members collection
        setFormData(prev => ({
          ...prev,
          authorVanshNo: user.VanshNo || '',
          authorName: user.firstName || user.name || user.username || ''
        }));
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    const base64Promises = fileArray.map(file => convertToBase64(file));
    const base64Images = await Promise.all(base64Promises);
    setFormData({ ...formData, images: [...formData.images, ...base64Images] });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newsData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        images: formData.images,
        authorVanshNo: formData.authorVanshNo ? parseInt(formData.authorVanshNo) : null
      };
      
      console.log('Submitting news data:', newsData);
      console.log('Title:', newsData.title);
      console.log('Content:', newsData.content);
      
      await onSubmit(newsData);
      onClose();
    } catch (error) {
      console.error('Error submitting news:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to add news. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add Family News</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter news title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Summary</label>
            <input
              type="text"
              maxLength={300}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Brief summary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
            <textarea
              required
              maxLength={5000}
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter full news content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="General">General</option>
                <option value="Announcement">Announcement</option>
                <option value="Achievement">Achievement</option>
                <option value="Celebration">Celebration</option>
                <option value="Milestone">Milestone</option>
                <option value="Memorial">Memorial</option>
                <option value="Tradition">Tradition</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Author Vansh No</label>
              <input
                type="number"
                value={formData.authorVanshNo}
                onChange={(e) => setFormData({ ...formData, authorVanshNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., 1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Author Name</label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter author name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., family, tradition, celebration"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-400'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Drag and drop images here, or</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="news-image-upload"
              />
              <label
                htmlFor="news-image-upload"
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
              >
                Select Images
              </label>
              <p className="text-xs text-gray-500 mt-2">Images will be converted to Base64 and stored in database</p>
            </div>
            
            {formData.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">{formData.images.length} image(s) selected</p>
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.visibleToAllVansh}
                onChange={(e) => setFormData({ ...formData, visibleToAllVansh: e.target.checked })}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">Visible to all Vansh</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add News'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// News Scroller Component
const NewsScroller = ({ news }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-4 overflow-hidden shadow-lg">
      <div className="relative flex">
        <div className="flex animate-scroll gap-4">
          {news.concat(news).map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-800 line-clamp-2 flex-1">
                    {item.title}
                  </h3>
                  {item.category && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full whitespace-nowrap">
                      {item.category}
                    </span>
                  )}
                </div>
                
                {item.summary && (
                  <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                    {item.summary}
                  </p>
                )}
                
                <div className="mt-auto space-y-1">
                  <div className="flex items-center text-amber-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="text-xs font-medium">
                      {formatDate(item.publishDate || item.createdAt)}
                    </span>
                  </div>
                  
                  {(item.publishDate || item.createdAt) && (
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span className="text-xs">
                        {formatTime(item.publishDate || item.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  {item.authorName && (
                    <div className="flex items-center text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      <span className="text-xs">
                        {item.authorName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

// News Card Component
const NewsCard = ({ newsItem, onClick }) => {
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = () => {
    setIsClicked(true);
    // Wait for animation to complete before calling onClick
    setTimeout(() => {
      onClick();
      setIsClicked(false);
    }, 300);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      General: 'bg-gray-100 text-gray-700',
      Announcement: 'bg-blue-100 text-blue-700',
      Achievement: 'bg-green-100 text-green-700',
      Milestone: 'bg-purple-100 text-purple-700',
      Memorial: 'bg-gray-100 text-gray-600',
      Celebration: 'bg-pink-100 text-pink-700'
    };
    return colors[category] || colors.General;
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 ${
        isClicked ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
      }`}
    >
      {newsItem.images && newsItem.images.length > 0 && (
        <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <img
            src={newsItem.images[0]}
            alt={newsItem.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(newsItem.category)}`}>
            {newsItem.category}
          </span>
          {newsItem.priority === 'High' || newsItem.priority === 'Urgent' ? (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded">
              {newsItem.priority}
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {newsItem.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {newsItem.summary || newsItem.content}
        </p>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <User className="w-4 h-4 mr-1" />
          <span className="mr-4">
            {newsItem.authorName || (newsItem.author?.firstName + ' ' + newsItem.author?.lastName) || 'Anonymous'}
          </span>
          <Calendar className="w-4 h-4 mr-1" />
          <span>{formatDate(newsItem.publishDate || newsItem.createdAt)}</span>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button className="text-amber-600 hover:text-amber-700 font-semibold text-sm">
            Read More →
          </button>
        </div>
      </div>
    </div>
  );
};

// News Detail Modal
const NewsDetailModal = ({ newsItem, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">News Details</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
              {newsItem.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {newsItem.title}
          </h1>

          <div className="flex items-center text-gray-600 mb-6 space-x-4">
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <span>
                {newsItem.author?.firstName} {newsItem.author?.lastName}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{formatDate(newsItem.publishDate || newsItem.createdAt)}</span>
            </div>
          </div>

          {newsItem.images && newsItem.images.length > 0 && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={newsItem.images[0]}
                alt={newsItem.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
              {newsItem.content}
            </p>
          </div>

          {newsItem.tags && newsItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {newsItem.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main News Page Component
export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [currentUserVansh, setCurrentUserVansh] = useState('');

  // Load current user vansh to scope news when not visibleToAllVansh
  useEffect(() => {
    const loadUserVansh = async () => {
      try {
        const res = await api.get('/api/auth/me');
        const vansh = res.data?.VanshNo || res.data?.vansh || '';
        setCurrentUserVansh(vansh ? `${vansh}`.trim() : '');
      } catch (err) {
        console.warn('Unable to fetch current user vansh for news:', err);
        setCurrentUserVansh('');
      }
    };
    loadUserVansh();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, currentUserVansh]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { category: selectedCategory };
      if (currentUserVansh) {
        params.vansh = currentUserVansh;
      }
      const response = await api.get('/api/news', { params });
      
      if (response.data.success) {
        setNews(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsClick = async (newsItem) => {
    try {
      const response = await api.get(`/api/news/${newsItem._id}`);
      if (response.data.success) {
        setSelectedNews(response.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error fetching news details:', err);
    }
  };

  const handleAddNews = async (newsData) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to add news');
      return;
    }

    try {
      await api.post('/api/news', newsData, { headers: { Authorization: `Bearer ${token}` } });
      
      // Refresh news list
      await fetchNews();
      
      // Show success toast
      setShowSuccessToast(true);
    } catch (err) {
      console.error('Error adding news:', err);
      throw err;
    }
  };

  const categories = [
    { value: 'all', label: 'All News' },
    { value: 'General', label: 'General' },
    { value: 'Announcement', label: 'Announcements' },
    { value: 'Achievement', label: 'Achievements' },
    { value: 'Celebration', label: 'Celebrations' },
    { value: 'Milestone', label: 'Milestones' },
    { value: 'Memorial', label: 'Memorials' }
  ];

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* News Scroller */}
      {news.length > 0 && <NewsScroller news={news.slice(0, 5)} />}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2">
                Family News
              </h1>
              <p className="text-gray-600">Stay updated with the latest happenings in our family</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add News
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* News Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No news found</p>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((newsItem) => (
              <NewsCard
                key={newsItem._id}
                newsItem={newsItem}
                onClick={() => handleNewsClick(newsItem)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNews && (
        <NewsDetailModal
          newsItem={selectedNews}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Add News Modal */}
      {showAddModal && (
        <AddNewsModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddNews}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message="News uploaded successfully!"
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      <Footer />
    </div>
  );
}
