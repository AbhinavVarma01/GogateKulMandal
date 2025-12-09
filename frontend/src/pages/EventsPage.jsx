import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Clock, Filter, Search, X, Plus, Upload, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import Footer from '../components/Footer';
import SuccessToast from '../components/SuccessToast';
import LoadingSpinner from '../components/LoadingSpinner';

// Add Event Modal Component
const AddEventModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    eventName: '',
    description: '',
    eventType: 'Reunion',
    location: '',
    venue: '',
    address: '',
    date: '',
    fromTime: '',
    toTime: '',
    createdByVanshNo: '',
    createdByName: '',
    eventImage: [],
    visibleToAllVansh: true,
    priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentUserVansh, setCurrentUserVansh] = useState('');

  // Fetch current user and auto-fill creator info
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
        
        // Auto-fill creator fields with firstName from members collection
        setFormData(prev => ({
          ...prev,
          createdByVanshNo: user.VanshNo || '',
          createdByName: user.firstName || user.name || user.username || ''
        }));
        setCurrentUserVansh(user.VanshNo || '');
      } catch (error) {
        console.error('Error fetching current user:', error);
        setCurrentUserVansh('');
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
    setFormData({ ...formData, eventImage: [...formData.eventImage, ...base64Images] });
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
    const newImages = formData.eventImage.filter((_, i) => i !== index);
    setFormData({ ...formData, eventImage: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mandatory fields
    if (!formData.title.trim()) {
      alert('Event Title is required');
      return;
    }
    if (!formData.description.trim()) {
      alert('Event Description is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const eventData = {
        title: formData.title.trim(),
        eventName: typeof formData.eventName === 'string' && formData.eventName.trim() ? formData.eventName.trim() : formData.title.trim(),
        description: formData.description.trim(),
        eventType: formData.eventType,
        location: typeof formData.location === 'string' ? formData.location.trim() : '',
        venue: typeof formData.venue === 'string' ? formData.venue.trim() : '',
        address: typeof formData.address === 'string' ? formData.address.trim() : '',
        date: formData.date || null,
        fromTime: formData.fromTime || '',
        toTime: formData.toTime || '',
        createdByVanshNo: formData.createdByVanshNo ? parseInt(formData.createdByVanshNo, 10) : null,
        createdByName: formData.createdByName,
        eventImage: Array.isArray(formData.eventImage) ? formData.eventImage : formData.eventImage ? [formData.eventImage] : [],
        visibleToAllVansh: formData.visibleToAllVansh,
        priority: formData.priority
      };
      
      await onSubmit(eventData);
      onClose();
    } catch (error) {
      console.error('Error submitting event:', error);
      const message = error?.response?.data?.message || 'Failed to add event. Please try again.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add Family Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter event description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Short name for event (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="Birthday">Birthday</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Wedding">Wedding</option>
                <option value="Festival">Festival</option>
                <option value="Reunion">Reunion</option>
                <option value="Memorial">Memorial</option>
                <option value="Cultural">Cultural</option>
                <option value="Religious">Religious</option>
                <option value="Health">Health</option>
                <option value="Online">Online</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Time</label>
              <input
                type="time"
                value={formData.fromTime}
                onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Time</label>
              <input
                type="time"
                value={formData.toTime}
                onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Belgaum City Hall"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Main Hall, Outdoor Pavilion"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Full address"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organizer Vansh No</label>
              <input
                type="number"
                value={formData.createdByVanshNo}
                onChange={(e) => setFormData({ ...formData, createdByVanshNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., 1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organizer Name</label>
              <input
                type="text"
                value={formData.createdByName}
                onChange={(e) => setFormData({ ...formData, createdByName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Organizer's name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Images *</label>
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
                id="event-image-upload"
              />
              <label
                htmlFor="event-image-upload"
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
              >
                Select Images
              </label>
              <p className="text-xs text-gray-500 mt-2">Images will be converted to Base64 and stored in database</p>
            </div>
            
            {formData.eventImage.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {formData.eventImage.map((img, index) => (
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
            <p className="mt-2 text-xs text-gray-500">{formData.eventImage.length} image(s) selected</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="visibleToAllVansh"
              checked={formData.visibleToAllVansh}
              onChange={(e) => setFormData({ ...formData, visibleToAllVansh: e.target.checked })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label htmlFor="visibleToAllVansh" className="text-sm font-medium text-gray-700">
              Visible to all Vansh
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Events Scroller Component
const EventsScroller = ({ events }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-4 overflow-hidden shadow-lg">
      <div className="relative flex">
        <div className="flex animate-scroll gap-4">
          {events.concat(events).map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <div className="flex flex-col h-full">
                {item.eventImage && item.eventImage.length > 0 && (
                  <div className="mb-2 -mx-4 -mt-4">
                    <img
                      src={Array.isArray(item.eventImage) ? item.eventImage[0] : item.eventImage}
                      alt={item.title}
                      className="w-full h-32 object-cover rounded-t-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-800 line-clamp-2 flex-1">
                    {item.title}
                  </h3>
                  {item.eventType && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full whitespace-nowrap">
                      {item.eventType}
                    </span>
                  )}
                </div>
                
                {item.description && (
                  <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="mt-auto space-y-1">
                  <div className="flex items-center text-amber-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="text-xs font-medium">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="text-xs">
                      {item.fromTime} - {item.toTime}
                    </span>
                  </div>
                  
                  {item.location && (
                    <div className="flex items-center text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="text-xs line-clamp-1">
                        {item.location}{item.venue ? `, ${item.venue}` : ''}
                      </span>
                    </div>
                  )}
                  
                  {item.createdByName && (
                    <div className="flex items-center text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      <span className="text-xs">
                        {item.createdByName}
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

// Event Card Component
const EventCard = ({ event, onClick }) => {
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

  const getEventTypeColor = (type) => {
    const colors = {
      Birthday: 'bg-pink-100 text-pink-700',
      Anniversary: 'bg-purple-100 text-purple-700',
      Wedding: 'bg-red-100 text-red-700',
      Festival: 'bg-orange-100 text-orange-700',
      Reunion: 'bg-blue-100 text-blue-700',
      Memorial: 'bg-gray-100 text-gray-700',
      Cultural: 'bg-amber-100 text-amber-700',
      Religious: 'bg-indigo-100 text-indigo-700',
      Other: 'bg-green-100 text-green-700'
    };
    return colors[type] || colors.Other;
  };

  const getStatusColor = (status) => {
    const colors = {
      Upcoming: 'bg-blue-100 text-blue-700',
      Ongoing: 'bg-green-100 text-green-700',
      Completed: 'bg-gray-100 text-gray-700',
      Cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.Upcoming;
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 ${
        isClicked ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
      }`}
    >
      <div className="h-3 bg-gradient-to-r from-amber-500 to-orange-500"></div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(event.eventType)}`}>
            {event.eventType}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {event.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-amber-600" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-amber-600" />
            <span>{event.fromTime} - {event.toTime}</span>
          </div>
          {(event.location || event.venue) && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-amber-600" />
              <span className="line-clamp-1">{event.location || event.venue || 'TBD'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-1" />
            <span className="text-sm">{event.createdByName || 'Anonymous'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Event Detail Modal
const EventDetailModal = ({ event, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const formatDateTime = (dateString, timeString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    })} at ${timeString}`;
  };

  // Handle image array or single string
  const eventImages = Array.isArray(event.eventImage) ? event.eventImage : (event.eventImage ? [event.eventImage] : []);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const hasImages = eventImages.length > 0;
  const postedDate = event?.createdAt || event?.updatedAt || event?.date || null;
  const postedLabel = (() => {
    if (!postedDate) return '';
    const parsed = new Date(postedDate);
    if (Number.isNaN(parsed.getTime())) return postedDate;
    return parsed.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  })();
  const eventDateLabel = (() => {
    if (!event?.date) return '';
    const parsed = new Date(event.date);
    if (Number.isNaN(parsed.getTime())) return event.date;
    return parsed.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  })();
  const eventTimeLabel = (() => {
    if (!event?.fromTime && !event?.toTime) return '';
    if (event?.fromTime && event?.toTime) return `${event.fromTime} - ${event.toTime}`;
    return event?.fromTime || event?.toTime || '';
  })();

  React.useEffect(() => {
    setActiveImageIndex(0);
  }, [event]);

  const handlePrevImage = () => {
    if (eventImages.length < 2) return;
    setActiveImageIndex((prev) => (prev - 1 + eventImages.length) % eventImages.length);
  };

  const handleNextImage = () => {
    if (eventImages.length < 2) return;
    setActiveImageIndex((prev) => (prev + 1) % eventImages.length);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#fff8f2] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-orange-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-900">Event Details</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-orange-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-amber-700" />
          </button>
        </div>

        <div className="p-6">
          <div className={`flex flex-col gap-6 ${hasImages ? 'lg:flex-row' : ''}`}>
            {hasImages && (
              <div className="lg:w-2/3 w-full">
                <div className="bg-white rounded-3xl shadow-md overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-[#fff2e0] border-b border-[#f8d8b0]">
                    <span className="text-lg font-semibold text-amber-700">Photo Gallery</span>
                    <span className="text-sm font-medium text-amber-600">
                      {activeImageIndex + 1} of {eventImages.length}
                    </span>
                  </div>
                  <div className="relative bg-black flex items-center justify-center min-h-[360px]">
                    <img
                      src={eventImages[activeImageIndex]}
                      alt={`${event.title || event.eventName} - Photo ${activeImageIndex + 1}`}
                      className="w-full h-full object-contain max-h-[520px]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {eventImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-amber-700 shadow-md hover:bg-white"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-amber-700 shadow-md hover:bg-white"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`${hasImages ? 'lg:w-1/3' : 'lg:w-full'} w-full`}>
              <div className="bg-white rounded-3xl shadow-md h-full p-6 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {event.eventType && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                      {event.eventType}
                    </span>
                  )}
                  {event.priority && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {event.priority}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
                  {event.title || event.eventName}
                </h1>

                {postedLabel && (
                  <p className="text-xs text-amber-600 mt-2">Posted: {postedLabel}</p>
                )}

                {event.description && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                )}

                {hasImages && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3">All Photos</h4>
                    <div className="flex flex-wrap gap-3">
                      {eventImages.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                            activeImageIndex === index ? 'border-amber-500' : 'border-transparent hover:border-amber-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${event.title || event.eventName} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-4 pt-6 border-t border-gray-100">
                  {eventDateLabel && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-amber-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Date & Time</p>
                        <p className="text-sm text-gray-700">{eventDateLabel}</p>
                        {eventTimeLabel && (
                          <p className="text-xs text-gray-500">{eventTimeLabel}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(event.location || event.venue || event.address) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-amber-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Location</p>
                        <p className="text-sm text-gray-700">{event.location || event.venue}</p>
                        {event.address && (
                          <p className="text-xs text-gray-500">{event.address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(event.createdByName || event.createdByVanshNo) && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-amber-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Created By</p>
                        <p className="text-sm text-gray-700">
                          {event.createdByName || 'Anonymous'}
                          {event.createdByVanshNo && ` (${event.createdByVanshNo})`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Events Page Component
export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [currentUserVansh, setCurrentUserVansh] = useState('');

  // Fetch current user vansh once to scope events
  useEffect(() => {
    const loadUserVansh = async () => {
      try {
        const res = await api.get('/api/auth/me');
        const vansh = res.data?.VanshNo || res.data?.vansh || '';
        setCurrentUserVansh(vansh ? `${vansh}`.trim() : '');
      } catch (err) {
        console.warn('Unable to fetch current user vansh for events:', err);
        setCurrentUserVansh('');
      }
    };
    loadUserVansh();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentUserVansh]);

  const computeStatus = (evt) => {
    try {
      if (!evt?.date) return 'Upcoming';
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDate = new Date(evt.date);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      if (eventDay.getTime() < today.getTime()) return 'Completed';
      if (eventDay.getTime() > today.getTime()) return 'Upcoming';
      // Same day -> try to determine using time window if available
      const from = evt.fromTime || '';
      const to = evt.toTime || '';
      // Fallback for same-day: Ongoing
      if (!from || !to) return 'Ongoing';
      return 'Ongoing';
    } catch (_) {
      return 'Upcoming';
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all events - filtering will be done on frontend
      const params = {};
      if (currentUserVansh) {
        params.vansh = currentUserVansh;
      }
      const response = await api.get('/api/events', Object.keys(params).length ? { params } : undefined);
      
      if (response.data.success) {
        const enriched = (response.data.data || []).map(e => ({ ...e, status: e.status || computeStatus(e) }));
        setEvents(enriched);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (event) => {
    try {
      const response = await api.get(`/api/events/${event._id}`);
      if (response.data.success) {
        setSelectedEvent(response.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    }
  };

  const handleAddEvent = async (eventData) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to add events');
      return;
    }

    try {
      if (!eventData.createdByVanshNo && currentUserVansh) {
        eventData.createdByVanshNo = currentUserVansh;
      }
      await api.post('/api/events', eventData, { headers: { Authorization: `Bearer ${token}` } });
      
      // Show success toast
      setShowSuccessToast(true);
      fetchEvents(); // Refresh the events list
    } catch (err) {
      console.error('Error adding event:', err);
      alert('Failed to add event. Please try again.');
    }
  };

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'Birthday', label: 'Birthdays' },
    { value: 'Anniversary', label: 'Anniversaries' },
    { value: 'Wedding', label: 'Weddings' },
    { value: 'Festival', label: 'Festivals' },
    { value: 'Reunion', label: 'Reunions' },
    { value: 'Memorial', label: 'Memorials' },
    { value: 'Cultural', label: 'Cultural' },
    { value: 'Religious', label: 'Religious' },
    { value: 'Other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Upcoming', label: 'Upcoming' },
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Completed', label: 'Completed' }
  ];

  const filteredEvents = events.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Event type filter
    const matchesEventType = selectedEventType === 'all' || 
      item.eventType === selectedEventType;
    
    // Status filter
    const matchesStatus = selectedStatus === 'all' || 
      item.status === selectedStatus;
    
    return matchesSearch && matchesEventType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Events Scroller */}
      {events.length > 0 && <EventsScroller events={events.slice(0, 5)} />}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2">
                Family Events
              </h1>
              <p className="text-gray-600">Discover and join upcoming family gatherings and celebrations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Event
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Event Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No events found</p>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEvent}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message="Event uploaded successfully!"
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      <Footer />
    </div>
  );
}
