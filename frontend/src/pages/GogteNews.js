import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, Calendar, Users, Star, RefreshCw, User, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AddNewsModal } from './AddNewsModal';
import Footer from '../components/Footer';

export default function GogteNewsPage() {
  const { t } = useTranslation();
  
  const [news, setNews] = useState([
    {
      id: 1,
      title: "GogateKulMandal Annual Meeting 2024",
      content: "Our kulamandal's annual meeting was successfully concluded. The participation of all family members made this event extremely joyful. Important decisions for the new year were discussed.",
      author: "Narayan Shankar",
      category: "announcement",
      location: "Guhagar, Maharashtra",
      eventDate: "2024-12-15",
      tags: ["meeting", "annual", "family", "decisions"],
      timestamp: "2 days ago",
      likes: 24,
      comments: 8,
      imageUrl: "/Gogte_News.jpg"
    },
    {
      id: 2,
      title: "Youth Generation's Academic Success",
      content: "Many young men and women from our family have achieved excellent academic performance this year. We are proud of their success in various fields.",
      author: "Dr. Mohan Krishna",
      category: "achievement",
      location: "Various locations",
      eventDate: "2024-12-01",
      tags: ["education", "achievement", "youth", "success"],
      timestamp: "1 week ago",
      likes: 18,
      comments: 12,
      imageUrl: null
    },
    {
      id: 3,
      title: "Traditional Festival Celebration",
      content: "On the occasion of Diwali, all members of our family came together and celebrated the festival in traditional style. We enjoyed worship, aarti and shared meals.",
      author: "Smita Charuhas",
      category: "celebration",
      location: "Family homes across Maharashtra",
      eventDate: "2024-11-12",
      tags: ["diwali", "festival", "celebration", "tradition"],
      timestamp: "2 weeks ago",
      likes: 31,
      comments: 15,
      imageUrl: null
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load news from localStorage on component mount
  useEffect(() => {
    const savedNews = localStorage.getItem('gogteNews');
    if (savedNews) {
      setNews(JSON.parse(savedNews));
    }
  }, []);

  // Save news to localStorage whenever news state changes
  useEffect(() => {
    localStorage.setItem('gogteNews', JSON.stringify(news));
  }, [news]);

  const categories = [
    { value: 'all', label: t('newsPage.allCategories') },
    { value: 'announcement', label: t('newsPage.categories.announcement') },
    { value: 'achievement', label: t('newsPage.categories.achievement') },
    { value: 'celebration', label: t('newsPage.categories.celebration') },
    { value: 'tradition', label: t('newsPage.categories.tradition') },
    { value: 'milestone', label: t('newsPage.categories.milestone') },
    { value: 'reunion', label: t('newsPage.categories.reunion') },
    { value: 'memory', label: t('newsPage.categories.memory') },
    { value: 'general', label: t('newsPage.categories.general') }
  ];

  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddNews = (newNews) => {
    const newsItem = {
      id: Date.now(),
      title: newNews.title,
      content: newNews.content,
      category: newNews.category,
      imageUrl: newNews.imageUrl,
      author: newNews.author || "Family Member",
      location: newNews.location,
      eventDate: newNews.eventDate,
      tags: newNews.tags || [],
      timestamp: "Just now",
      likes: 0,
      comments: 0
    };
    setNews([newsItem, ...news]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      // In a real app, you would fetch fresh data from the server here
    }, 1000);
  };

  const handleNewsClick = (newsItem) => {
    // Find the latest version of this news item from the state
    const latestNewsItem = news.find(item => item.id === newsItem.id) || newsItem;
    setSelectedNews(latestNewsItem);
    setShowDetailModal(true);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-amber-800 mb-2">{t('newsPage.title')}</h1>
              <p className="text-amber-700">{t('newsPage.subtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {t('newsPage.backToDashboard')}
              </Link>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <AddNewsModal onAddNews={handleAddNews} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('newsPage.searchNews')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-amber-700">एकूण बातम्या</p>
                <p className="text-2xl font-bold text-amber-800">{news.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-amber-700">सक्रिय लेखक</p>
                <p className="text-2xl font-bold text-amber-800">{new Set(news.map(n => n.author)).size}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-amber-700">एकूण लाइक्स</p>
                <p className="text-2xl font-bold text-amber-800">{news.reduce((sum, n) => sum + n.likes, 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center">
              <Filter className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-amber-700">श्रेण्या</p>
                <p className="text-2xl font-bold text-amber-800">{categories.length - 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.length > 0 ? (
            filteredNews.map(newsItem => (
              <div 
                key={newsItem.id} 
                onClick={() => handleNewsClick(newsItem)}
                className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              >
                {/* Image */}
                <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-200 relative">
                  {newsItem.imageUrl ? (
                    <img 
                      src={newsItem.imageUrl} 
                      alt={newsItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl">📰</span>
                        </div>
                        <p className="text-amber-600 font-medium">No Image</p>
                      </div>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {categories.find(cat => cat.value === newsItem.category)?.label || newsItem.category}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-amber-800 mb-2 line-clamp-2">
                    {newsItem.title}
                  </h3>
                  <p className="text-amber-700 mb-4 line-clamp-3">
                    {newsItem.content}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-amber-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {newsItem.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {newsItem.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-orange-200 p-12 text-center">
              <div className="text-amber-500 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">कोणतीही बातम्या सापडल्या नाहीत</h3>
              <p className="text-amber-700">आपल्या शोध निकषांनुसार कोणतीही बातम्या उपलब्ध नाहीत.</p>
            </div>
          )}
        </div>
      </div>

      {/* News Detail Modal */}
      {showDetailModal && selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-orange-200">
              <h2 className="text-2xl font-bold text-amber-800">News Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-amber-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-amber-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg mb-6 relative overflow-hidden">
                {selectedNews.imageUrl ? (
                  <img 
                    src={selectedNews.imageUrl} 
                    alt={selectedNews.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📰</span>
                      </div>
                      <p className="text-amber-600 font-medium text-lg">No Image Available</p>
                    </div>
                  </div>
                )}
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {categories.find(cat => cat.value === selectedNews.category)?.label || selectedNews.category}
                  </span>
                </div>
              </div>

              {/* Title and Meta */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-amber-800 mb-4">{selectedNews.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-amber-600 mb-4">
                  <span className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    <strong>Author:</strong> {selectedNews.author}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <strong>Posted:</strong> {selectedNews.timestamp}
                  </span>
                  {selectedNews.location && (
                    <span className="flex items-center">
                      <span className="w-5 h-5 mr-2">📍</span>
                      <strong>Location:</strong> {selectedNews.location}
                    </span>
                  )}
                  {selectedNews.eventDate && (
                    <span className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      <strong>Event Date:</strong> {new Date(selectedNews.eventDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {selectedNews.tags && selectedNews.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedNews.tags.map((tag, index) => (
                      <span key={index} className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-amber-800 mb-3">Story</h3>
                <p className="text-amber-700 leading-relaxed text-lg">{selectedNews.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
