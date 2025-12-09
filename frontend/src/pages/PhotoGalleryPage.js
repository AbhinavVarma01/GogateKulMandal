import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Filter, Search, Calendar, Users, Star, RefreshCw, User, Clock, X, Send, Camera, MapPin, Tag, Plus, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AddPhotoModal } from './AddPhotoModal';
import { PhotoCard } from './PhotoCard';
import Footer from '../components/Footer';

const API_URL = (import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || window.location.origin) + '/api/media';

export default function PhotoGalleryPage() {
  const { t } = useTranslation();
  
  const [photos, setPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isGalleryMode, setIsGalleryMode] = useState(false);
  const [currentGalleryPhotos, setCurrentGalleryPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load photos from API on component mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL);
      // Transform API data to match UI structure
      const transformedPhotos = response.data.map(photo => ({
        id: photo._id,
        title: photo.title,
        description: photo.description,
        photographer: photo.photographer,
        category: photo.category,
        location: photo.location,
        eventDate: photo.eventDate,
        tags: photo.tags || [],
        timestamp: formatTimestamp(photo.uploaded_date),
        likes: photo.likes || 0,
        comments: photo.comments?.length || 0,
        commentsList: photo.comments || [],
        imageUrl: photo.image?.data || photo.image?.url,
        imageUrls: photo.imageUrls?.map(img => img.data || img.url) || [],
        generation: photo.generation,
        occasion: photo.occasion,
        isCollection: photo.isCollection || false,
        photoCount: photo.photoCount || 1
      }));
      setPhotos(transformedPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const uploadDate = new Date(date);
    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.photographer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDetailModal && isGalleryMode) {
        if (e.key === 'ArrowRight') {
          handleNextPhoto();
        } else if (e.key === 'ArrowLeft') {
          handlePrevPhoto();
        } else if (e.key === 'Escape') {
          handleCloseModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal, isGalleryMode, currentPhotoIndex, filteredPhotos]);

  const handleAddPhoto = async (newPhoto) => {
    try {
      const formData = new FormData();
      formData.append('title', newPhoto.title);
      formData.append('description', newPhoto.description);
      formData.append('category', newPhoto.category);
      formData.append('photographer', newPhoto.photographer || 'Family Member');
      formData.append('location', newPhoto.location);
      formData.append('eventDate', newPhoto.eventDate);
      formData.append('generation', newPhoto.generation || '2020s');
      formData.append('occasion', newPhoto.occasion || 'General');
      
      // Add tags
      if (newPhoto.tags && newPhoto.tags.length > 0) {
        newPhoto.tags.forEach(tag => formData.append('tags', tag));
      }

      // Handle multiple image uploads
      if (newPhoto.files && newPhoto.files.length > 0) {
        newPhoto.files.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh photos list after upload - WAIT for it to complete
      await fetchPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPhotos();
    setIsRefreshing(false);
  };

  const handlePhotoClick = (photoItem) => {
    // Find the latest version of this photo item from the state
    const latestPhotoItem = photos.find(item => item.id === photoItem.id) || photoItem;
    setSelectedPhoto(latestPhotoItem);
    setShowDetailModal(true);
    setIsGalleryMode(true);
    
    // If it's a collection, create a flattened array of all images
    if (latestPhotoItem.isCollection && latestPhotoItem.imageUrls) {
      const allImages = latestPhotoItem.imageUrls.map((url, index) => ({
        ...latestPhotoItem,
        id: `${latestPhotoItem.id}-${index}`,
        imageUrl: url,
        isFromCollection: true,
        collectionId: latestPhotoItem.id
      }));
      
      setCurrentGalleryPhotos(allImages);
      setCurrentPhotoIndex(0);
      setSelectedPhoto(allImages[0]);
    } else {
      // Use filtered photos for single images
      setCurrentGalleryPhotos(filteredPhotos);
      const photoIndex = filteredPhotos.findIndex(photo => photo.id === photoItem.id);
      setCurrentPhotoIndex(photoIndex >= 0 ? photoIndex : 0);
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < currentGalleryPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
      setSelectedPhoto(currentGalleryPhotos[currentPhotoIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
      setSelectedPhoto(currentGalleryPhotos[currentPhotoIndex - 1]);
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setIsGalleryMode(false);
    setCurrentPhotoIndex(0);
  };

  // Likes and comments are not displayed in the gallery UI per design.

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-amber-800 mb-2">Kulmandal Photo Gallery</h1>
              <p className="text-amber-700">Collection of precious family moments</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <AddPhotoModal onAddPhoto={handleAddPhoto} />
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
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center">
              <Camera className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-amber-700">Total Photos</p>
                <p className="text-2xl font-bold text-amber-800">{photos.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-amber-700">Events Recorded</p>
                <p className="text-2xl font-bold text-amber-800">{photos.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map(photoItem => (
              <div 
                key={photoItem.id} 
                onClick={() => handlePhotoClick(photoItem)}
                className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              >
                {/* Image */}
                <div className="h-72 bg-gradient-to-br from-amber-100 to-orange-200 relative">
                  {photoItem.imageUrl ? (
                    <img 
                      src={photoItem.imageUrl} 
                      alt={photoItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Camera className="w-8 h-8 text-amber-600" />
                        </div>
                        <p className="text-amber-600 font-medium">No Image</p>
                      </div>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {photoItem.category || 'General'}
                    </span>
                  </div>
                  
                  {/* Collection Indicator */}
                  {photoItem.isCollection && photoItem.photoCount > 1 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        {photoItem.photoCount} photos
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-amber-800 mb-2 line-clamp-2">
                    {photoItem.title}
                  </h3>
                  <p className="text-amber-700 mb-4 line-clamp-3">
                    {photoItem.description}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-amber-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {photoItem.photographer}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {photoItem.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-orange-200 p-12 text-center">
              <div className="text-amber-500 mb-4">
                <Camera className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">No Photos Found</h3>
              <p className="text-amber-700">No photos match your current search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {showDetailModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-amber-800">Photo Gallery</h2>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                  {currentPhotoIndex + 1} of {currentGalleryPhotos.length}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-amber-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-amber-600" />
              </button>
            </div>

            {/* Gallery Content */}
            <div className="flex h-[calc(95vh-120px)]">
              {/* Main Photo Display */}
              <div className="flex-1 relative bg-black flex items-center justify-center">
                {selectedPhoto.imageUrl ? (
                  <img 
                    src={selectedPhoto.imageUrl} 
                    alt={selectedPhoto.title}
                    className="max-w-full max-h-full object-contain transition-all duration-500 ease-in-out"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📸</span>
                      </div>
                      <p className="text-amber-300 font-medium text-lg">No Image Available</p>
                    </div>
                  </div>
                )}
                
                {/* Navigation Arrows */}
                {currentGalleryPhotos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      disabled={currentPhotoIndex === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      disabled={currentPhotoIndex === currentGalleryPhotos.length - 1}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    {selectedPhoto.category || 'General'}
                  </span>
                </div>
              </div>

              {/* Photo Details Sidebar */}
              <div className="w-96 bg-white border-l border-orange-200 overflow-y-auto">
                <div className="p-6">

                  {/* Title and Meta */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-amber-800 mb-4 line-clamp-2">{selectedPhoto.title}</h1>
                    
                    <div className="space-y-3 text-amber-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm"><strong>Posted:</strong> {selectedPhoto.timestamp}</span>
                      </div>
                      {selectedPhoto.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm"><strong>Location:</strong> {selectedPhoto.location}</span>
                        </div>
                      )}
                      {selectedPhoto.eventDate && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm"><strong>Event Date:</strong> {new Date(selectedPhoto.eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedPhoto.tags.map((tag, index) => (
                          <span key={index} className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-amber-800 mb-3">Description</h3>
                    <p className="text-amber-700 leading-relaxed text-sm">{selectedPhoto.description}</p>
                  </div>

                  {/* Actions: (removed Share button as per UI simplification) */}

                  {/* Thumbnail Gallery */}
                  {currentGalleryPhotos.length > 1 && (
                    <div className="border-t border-orange-200 pt-4">
                      <h3 className="text-lg font-semibold text-amber-800 mb-3">All Photos</h3>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {currentGalleryPhotos.map((photo, index) => (
                          <div
                            key={photo.id}
                            onClick={() => {
                              setCurrentPhotoIndex(index);
                              setSelectedPhoto(photo);
                            }}
                            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
                              index === currentPhotoIndex 
                                ? 'ring-2 ring-amber-500 scale-105' 
                                : 'hover:scale-105 hover:shadow-lg'
                            }`}
                          >
                            <img
                              src={photo.imageUrl}
                              alt={photo.title}
                              className="w-full h-20 object-cover"
                            />
                            {index === currentPhotoIndex && (
                              <div className="absolute inset-0 bg-amber-500 bg-opacity-20 flex items-center justify-center">
                                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
