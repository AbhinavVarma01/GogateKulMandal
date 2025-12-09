import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, User, Calendar, Mail, Phone, MapPin, FileText, Shield, Bell, Search, Clock, AlertCircle, Eye, UserCheck, UserX, RefreshCw, Edit, Trash2 } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DescendantTree from '../components/member-details/DescendantTree';

// Image compression utility
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Optimized Member Card Component with React.memo
const MemberCard = React.memo(({ member, onEdit, onDelete, onView }) => {
  // Memoize expensive computations
  const fullName = useMemo(() => {
    const pd = member.personalDetails;
    if (!pd) return 'Unknown';
    return `${pd.firstName || ''} ${pd.middleName || ''} ${pd.lastName || ''}`.trim();
  }, [member.personalDetails]);

  const formattedDate = useMemo(() => {
    if (!member.reviewedAt) return 'N/A';
    const date = new Date(member.reviewedAt);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [member.reviewedAt]);

  const pd = member.personalDetails || {};

  return (
    <div
      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {member.serNo && (
              <span className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-bold">
                #{member.serNo}
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-800">{fullName}</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              Approved Member
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
              <Mail className="w-4 h-4 text-green-500" />
              <span className="font-medium">{pd.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
              <User className="w-4 h-4 text-green-500" />
              <span className="font-medium">{pd.gender || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="font-medium">Approved: {formattedDate}</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Vansh: <span className="font-semibold">{pd.vansh || 'N/A'}</span> | 
            Phone: <span className="font-semibold ml-2">{pd.mobileNumber || 'N/A'}</span>
            {member.serNo && (
              <> | SerNo: <span className="font-semibold ml-2">{member.serNo}</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(member)}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
            title="Edit Member"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDelete(member._id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete Member"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onView(member)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

MemberCard.displayName = 'MemberCard';

// Recursive component to render MongoDB document fields
const RenderField = ({ fieldKey, value, level }) => {
  const indent = level * 20;
  
  // Format field key to be more readable
  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Determine the type and render accordingly
  const renderValue = () => {
    // Null or undefined
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    // Boolean
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-sm font-semibold ${
          value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {value.toString()}
        </span>
      );
    }

    // Number
    if (typeof value === 'number') {
      return <span className="text-blue-600 font-mono">{value}</span>;
    }

    // Date string
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return (
        <span className="text-purple-600">
          {new Date(value).toLocaleString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      );
    }

    // String
    if (typeof value === 'string') {
      return <span className="text-gray-800">{value || <span className="text-gray-400 italic">empty</span>}</span>;
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">empty array</span>;
      }
      return (
        <div className="mt-2 space-y-2">
          {value.map((item, index) => (
            <div key={index} className="ml-6 p-3 bg-gray-50 rounded-lg border-l-2 border-orange-300">
              <span className="text-xs font-semibold text-gray-500 mr-2">[{index}]</span>
              {typeof item === 'object' && item !== null ? (
                <div className="mt-2 space-y-2">
                  {Object.entries(item).map(([subKey, subValue]) => (
                    <RenderField key={subKey} fieldKey={subKey} value={subValue} level={level + 2} />
                  ))}
                </div>
              ) : (
                <span className="text-gray-800">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Object (nested document)
    if (typeof value === 'object') {
      return (
        <div className="mt-2 ml-4 space-y-2 p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg border border-gray-200">
          {Object.entries(value).map(([subKey, subValue]) => (
            <RenderField key={subKey} fieldKey={subKey} value={subValue} level={level + 1} />
          ))}
        </div>
      );
    }

    return <span className="text-gray-600">{String(value)}</span>;
  };

  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0" style={{ paddingLeft: `${indent}px` }}>
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <span className="text-sm font-bold text-gray-700 min-w-[200px] pt-1">
            {formatKey(fieldKey)}:
          </span>
          <div className="flex-1">
            {renderValue()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple component to display a single data field
const DataField = ({ label, value }) => {
  // Format the label to be more readable
  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Format the value for display
  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }
    
    if (typeof val === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-sm font-semibold ${
          val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {val ? 'Yes' : 'No'}
        </span>
      );
    }
    
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return new Date(val).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    return String(val);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {formatLabel(label)}
      </label>
      <div className="text-base text-slate-900 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
        {formatValue(value)}
      </div>
    </div>
  );
};

const GogteKulAdmin = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectedMembers, setRejectedMembers] = useState([]);
  const [approvedMembersData, setApprovedMembersData] = useState([]);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [pendingRejection, setPendingRejection] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [viewSourceTab, setViewSourceTab] = useState(null); // Track which tab opened the view modal
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState(null); // { action: 'approve' or 'reject', count: number }
  const [showClearRejectedConfirm, setShowClearRejectedConfirm] = useState(false);
  
  // News & Events states
  const [newsItems, setNewsItems] = useState([]);
  const [eventsItems, setEventsItems] = useState([]);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteNewsModal, setShowDeleteNewsModal] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [deletingNews, setDeletingNews] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [newsFormImages, setNewsFormImages] = useState([]);
  const [eventFormImages, setEventFormImages] = useState([]);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [deletingNewsId, setDeletingNewsId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [totalApprovedMembers, setTotalApprovedMembers] = useState(0);
  const [loadingApprovedMembers, setLoadingApprovedMembers] = useState(false);
  const [adminManagedVansh, setAdminManagedVansh] = useState(null);

  // Reset to page 1 when tab changes or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const getAdminVansh = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        const response = await api.get('/api/auth/me');
        console.log('Auth response:', response.data);
        if (response.data.role === 'master_admin' || response.data.isMasterAdmin) {
          setAdminManagedVansh('');
          return '';
        }
        if (response.data.managedVansh) {
          console.log('Setting managedVansh to:', response.data.managedVansh);
          setAdminManagedVansh(response.data.managedVansh);
          return response.data.managedVansh;
        }
        // Explicitly set to empty string when the admin has no vansh constraint
        setAdminManagedVansh('');
        return '';
      }
    } catch (err) {
      console.error('Error fetching admin vansh:', err);
    }
    return null;
  };

  // Fetch registrations from server
  useEffect(() => {
    const loadData = async () => {
      const vansh = await getAdminVansh();
      await Promise.all([
        fetchRegistrations(vansh),
        fetchRejectedMembers(vansh),
        fetchApprovedMembers(vansh),
        fetchNews(),
        fetchEvents()
      ]);
    };
    loadData();
  }, []);

  const fetchRegistrations = async (vansh = adminManagedVansh) => {
    try {
      setLoading(true);
      const params = {};
      if (vansh !== null && vansh !== undefined && vansh !== '') {
        params.vansh = `${vansh}`.trim();
      }
      const response = await api.get('/api/family/registrations', { params });
      if (response.data.success) {
        console.log('Received registrations:', response.data.data.length);
        setRegistrations(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedMembers = async (vansh = adminManagedVansh) => {
    try {
      const params = {};
      if (vansh !== null && vansh !== undefined && vansh !== '') {
        params.vansh = `${vansh}`.trim();
      }
      const response = await api.get('/api/family/all', { params });
      if (response.data.success) {
        console.log('Received approved members:', response.data.data.length);
        setApprovedMembersData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching approved members:', err);
    }
  };

  const fetchRejectedMembers = async (vansh = adminManagedVansh) => {
    try {
      const params = {};
      if (vansh !== null && vansh !== undefined && vansh !== '') {
        params.vansh = `${vansh}`.trim();
      }
      const response = await api.get('/api/family/rejected', { params });
      if (response.data.success) {
        setRejectedMembers(response.data.data);
      }
    } catch (err) {
      console.error('❌ Error fetching rejected members:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const vansh = adminManagedVansh;
    await Promise.all([
      fetchRegistrations(vansh),
      fetchRejectedMembers(vansh),
      fetchApprovedMembers(vansh),
      fetchNews(),
      fetchEvents()
    ]);
    setRefreshing(false);
  };

  // Fetch News
  const fetchNews = async (vansh = adminManagedVansh) => {
    try {
      const params = vansh ? { vansh, _t: Date.now() } : { _t: Date.now() };
      const response = await api.get('/api/news', { params });
      if (response.data.success) {
        setNewsItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  // Fetch Events
  const fetchEvents = async (vansh = adminManagedVansh) => {
    try {
      const params = vansh ? { vansh, _t: Date.now() } : { _t: Date.now() };
      const response = await api.get('/api/events', { params });
      if (response.data.success) {
        setEventsItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // News CRUD Operations
  const handleCreateNews = async (newsData) => {
    try {
      setIsProcessing(true);
      // Add vansh to news data
      const dataWithVansh = {
        ...newsData,
        vansh: adminManagedVansh || undefined
      };
      const response = await api.post('/api/news', dataWithVansh);
      if (response.data.success) {
        setSuccessMessage('News created successfully! 📰');
        setShowSuccessModal(true);
        setShowNewsModal(false);
        setNewsFormImages([]);
        await fetchNews();
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating news:', error);
      alert(`Failed to create news: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateNews = async (id, newsData) => {
    try {
      setIsProcessing(true);
      const response = await api.put(`/api/news/${id}`, newsData);
      if (response.data.success) {
        setSuccessMessage('News updated successfully! ✅');
        setShowSuccessModal(true);
        setShowNewsModal(false);
        setEditingNews(null);
        await fetchNews();
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating news:', error);
      alert(`Failed to update news: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNews = async (news) => {
    setDeletingNews(news);
    setShowDeleteNewsModal(true);
  };

  const confirmDeleteNews = async () => {
    if (!deletingNews) return;
    
    try {
      setIsProcessing(true);
      const response = await api.delete(`/api/news/${deletingNews._id}`);
      if (response.data.success) {
        setSuccessMessage('News deleted successfully! 🗑️');
        setShowSuccessModal(true);
        setShowDeleteNewsModal(false);
        setDeletingNews(null);
        setSelectedNews(null); // Close detail modal immediately
        await fetchNews(); // Refresh news list
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      alert(`Failed to delete news: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Events CRUD Operations
  const handleCreateEvent = async (eventData) => {
    try {
      setIsProcessing(true);
      // Add vansh to event data
      const dataWithVansh = {
        ...eventData,
        vansh: adminManagedVansh || undefined
      };
      const response = await api.post('/api/events', dataWithVansh);
      if (response.data.success) {
        setSuccessMessage('Event created successfully! 🎉');
        setShowSuccessModal(true);
        setShowEventModal(false);
        setEventFormImages([]);
        await fetchEvents();
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Failed to create event: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateEvent = async (id, eventData) => {
    try {
      setIsProcessing(true);
      const response = await api.put(`/api/events/${id}`, eventData);
      if (response.data.success) {
        setSuccessMessage('Event updated successfully! ✅');
        setShowSuccessModal(true);
        setShowEventModal(false);
        setEditingEvent(null);
        setEventFormImages([]);
        await fetchEvents();
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Failed to update event: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    setDeletingEvent(event);
    setShowDeleteEventModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEvent) return;
    
    try {
      setIsProcessing(true);
      const response = await api.delete(`/api/events/${deletingEvent._id}`);
      if (response.data.success) {
        setSuccessMessage('Event deleted successfully! 🗑️');
        setShowSuccessModal(true);
        setShowDeleteEventModal(false);
        setDeletingEvent(null);
        setSelectedEvent(null); // Close detail modal immediately
        await fetchEvents(); // Refresh events list
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch full details with images when viewing a member
  const handleViewDetails = useCallback(async (member, sourceTab = null) => {
    setLoadingDetails(true);
    setSelectedRequest(member); // Show modal immediately with basic data
    setViewSourceTab(sourceTab); // Track which tab this was opened from
    
    try {
      // Fetch full details including images
      const response = await api.get(`/api/family/registrations/${member._id}`);
      if (response.data.success) {
        setSelectedRequest(response.data.data); // Update with full data including images
      }
    } catch (error) {
      console.error('❌ Error fetching full details:', error);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Filter registrations by status
  // Treat records without status as 'pending' (for backwards compatibility)
  const allPendingRegistrations = registrations.filter(r => !r.status || r.status === 'pending' || r.status === 'under_review');
  const allApprovedMembers = approvedMembersData; // Use data from members collection
  const rejectedRequests = registrations.filter(r => r.status === 'rejected');

  // Search filter function
  const filterBySearch = (items) => {
    if (!searchTerm.trim()) return items;
    
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => {
      const pd = item.personalDetails || {};
      const pi = item.parentsInformation || {};
      const spouse = item.spouseInformation || {};
      
      // Search in personal details
      const firstName = (pd.firstName || '').toLowerCase();
      const middleName = (pd.middleName || '').toLowerCase();
      const lastName = (pd.lastName || '').toLowerCase();
      const fullName = `${firstName} ${middleName} ${lastName}`.trim();
      const email = (pd.email || '').toLowerCase();
      const phone = (pd.phoneNumber || '').toLowerCase();
      const city = (pd.city || '').toLowerCase();
      const state = (pd.state || '').toLowerCase();
      
      // Search in parents information
      const fatherName = `${pi.fatherFirstName || ''} ${pi.fatherLastName || ''}`.toLowerCase();
      const motherName = `${pi.motherFirstName || ''} ${pi.motherLastName || ''}`.toLowerCase();
      
      // Search in spouse information
      const spouseName = `${spouse.spouseFirstName || ''} ${spouse.spouseLastName || ''}`.toLowerCase();
      
      // Search in relation to parent
      const relation = (pi.relationToParent || '').toLowerCase();
      
      return fullName.includes(searchLower) ||
             firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower) ||
             city.includes(searchLower) ||
             state.includes(searchLower) ||
             fatherName.includes(searchLower) ||
             motherName.includes(searchLower) ||
             spouseName.includes(searchLower) ||
             relation.includes(searchLower);
    });
  };

  // Apply search filter with useMemo
  const pendingRegistrations = useMemo(() => filterBySearch(allPendingRegistrations), [allPendingRegistrations, searchTerm]);
  const approvedMembers = useMemo(() => filterBySearch(allApprovedMembers), [allApprovedMembers, searchTerm]);
  const filteredRejectedMembers = useMemo(() => filterBySearch(rejectedMembers), [rejectedMembers, searchTerm]);
  const treeRootMember = useMemo(() => {
    if (!approvedMembers || approvedMembers.length === 0) return null;
    const noParent = approvedMembers.find((member) => !member.fatherSerNo && !member.motherSerNo);
    if (noParent) return noParent;
    const levelZero = approvedMembers.find((member) => member.level === 0);
    if (levelZero) return levelZero;
    return approvedMembers[0];
  }, [approvedMembers]);

  // Pagination logic
  const getCurrentPageData = (data) => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return data.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  // Get paginated data based on active tab with useMemo
  const paginatedPendingRegistrations = useMemo(() => getCurrentPageData(pendingRegistrations), [pendingRegistrations, currentPage, recordsPerPage]);
  const paginatedApprovedMembers = useMemo(() => getCurrentPageData(approvedMembers), [approvedMembers, currentPage, recordsPerPage]);
  const paginatedRejectedMembers = useMemo(() => getCurrentPageData(filteredRejectedMembers), [filteredRejectedMembers, currentPage, recordsPerPage]);

  // Pagination handlers
  const handleNextPage = () => {
    const totalPages = activeTab === 'pending' 
      ? getTotalPages(pendingRegistrations)
      : activeTab === 'approved'
      ? getTotalPages(approvedMembers)
      : getTotalPages(filteredRejectedMembers);
    
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Debug logging only when registrations change
  useEffect(() => {
    if (registrations.length > 0) {
      console.log('🔍 All registrations:', registrations.length);
      console.log('⏳ Pending:', allPendingRegistrations.length);
      console.log('✅ Approved:', allApprovedMembers.length);
      console.log('❌ Rejected:', rejectedRequests.length);
      console.log('📋 Sample registration:', registrations[0]);
    }
  }, [registrations.length, allPendingRegistrations.length, allApprovedMembers.length, rejectedRequests.length, registrations]);

  const handleApprove = async (id, applicantData) => {
    setApprovalAction({ type: 'approve', id, data: applicantData });
    setShowApprovalModal(true);
  };

  const handleReject = async (id, applicantData) => {
    // Show first confirmation
    setPendingRejection({ id, data: applicantData });
    setShowConfirmReject(true);
  };

  const confirmReject = () => {
    // Close first confirmation and show second
    setShowConfirmReject(false);
    if (pendingRejection) {
      setApprovalAction({ type: 'reject', id: pendingRejection.id, data: pendingRejection.data });
      setShowApprovalModal(true);
      setPendingRejection(null);
    }
  };

  const confirmAction = async () => {
    if (!approvalAction) return;

    const actionType = approvalAction.type;
    const status = actionType === 'approve' ? 'approved' : 'rejected';
    const recordId = approvalAction.id;
    
    // Close the approval modal immediately
    setShowApprovalModal(false);
    
    // Remove the record from the list immediately for better UX
    setRegistrations(prev => prev.filter(reg => reg._id !== recordId));
    
    // Show processing/loading state
    setIsProcessing(true);

    try {
      console.log('🔄 Sending request to update status:', { id: recordId, status });
      
      // Call the form-gkm server (proxied /api) for status updates
      const response = await api.patch(`/api/family/registrations/${recordId}/status`, {
        status,
        adminNotes: approvalAction.notes || ''
      });

      console.log('📥 Received response:', response.data);

      if (response.data.success) {
        console.log('✅ Status update successful');
        console.log(`✅ ${status} registration:`, recordId);
        
        // Hide processing IMMEDIATELY - don't wait for anything
        setIsProcessing(false);
        
        if (status === 'approved') {
          fetchApprovedMembers(adminManagedVansh).catch(err => {
            console.error('⚠️ Failed to fetch approved members:', err);
          });
        }
        
        // Show success popup
        setSuccessMessage(status === 'approved' ? 'Registration Approved! ✅ Email sent to user.' : 'Registration Deleted Successfully!');
        setShowSuccessModal(true);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        // If failed, restore the record
        setIsProcessing(false);
        await fetchRegistrations();
        alert(`Failed to ${actionType} registration: ${response.data.message}`);
      }
    } catch (err) {
      console.error('❌ Error updating registration:', err);
      console.error('❌ Error response:', err.response?.data);
      
      // Hide processing
      setIsProcessing(false);
      
      // If failed, restore the record
      await fetchRegistrations();
      
      // Show error
      alert(`Failed to update registration status: ${err.response?.data?.message || err.message}`);
    } finally {
      // Ensure processing state is ALWAYS cleared
      setIsProcessing(false);
      setApprovalAction(null);
    }
  };

  const toggleMemberSelection = (id) => {
    setSelectedMembers(prev => 
      prev.includes(id) 
        ? prev.filter(memberId => memberId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    if (selectedMembers.length === 0) return;
    
    // Show confirmation modal
    setBulkAction({ action, count: selectedMembers.length });
    setShowBulkConfirm(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction) return;
    
    const { action } = bulkAction;
    const actionText = action === 'approve' ? 'approve' : 'reject';
    
    // Close confirmation modal
    setShowBulkConfirm(false);
    setBulkAction(null);
    
    setIsProcessing(true);
    
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const results = [];
      const errors = [];
      
      // Process each selected member
      for (const memberId of selectedMembers) {
        try {
          const response = await api.patch(`/api/family/registrations/${memberId}/status`, {
            status,
            adminNotes: `Bulk ${actionText} action`
          });
          
          if (response.data.success) {
            results.push(memberId);
          } else {
            errors.push({ id: memberId, error: response.data.message });
          }
        } catch (err) {
          console.error(`Error ${actionText}ing ${memberId}:`, err);
          errors.push({ id: memberId, error: err.message });
        }
      }
      
      // Update the UI
      if (results.length > 0) {
        setRegistrations(prev => prev.filter(reg => !results.includes(reg._id)));
        
        if (status === 'approved') {
          await fetchApprovedMembers(adminManagedVansh).catch(err => {
            console.error('⚠️ Failed to fetch approved members:', err);
          });
        }
        
        const successMsg = `Successfully ${actionText}ed ${results.length} registration(s)!${errors.length > 0 ? ` ${errors.length} failed.` : ''}`;
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
      
      if (errors.length > 0 && results.length === 0) {
        alert(`Failed to ${actionText} all registrations. Please try again.`);
      }
      
      // Clear selection
      setSelectedMembers([]);
      
    } catch (err) {
      console.error(`Error in bulk ${actionText}:`, err);
      alert(`An error occurred during bulk ${actionText}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler to clear all rejected members
  const handleClearRejectedList = () => {
    if (rejectedMembers.length === 0) {
      alert('No rejected members to clear.');
      return;
    }

    // Show confirmation modal
    setShowClearRejectedConfirm(true);
  };

  const confirmClearRejectedList = async () => {
    // Close confirmation modal
    setShowClearRejectedConfirm(false);

    setIsProcessing(true);
    try {
      const params = {};
      if (adminManagedVansh !== null && adminManagedVansh !== undefined && adminManagedVansh !== '') {
        params.vansh = `${adminManagedVansh}`.trim();
      }

      const response = await api.delete('/api/family/rejected', { params });
      
      if (response.data.success) {
        setRejectedMembers([]);
        setSuccessMessage(`Successfully cleared ${response.data.deletedCount} rejected member(s)!`);
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        alert('Failed to clear rejected list. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error clearing rejected list:', err);
      alert('An error occurred while clearing the rejected list. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // CRUD handlers for approved members with useCallback
  const handleEditMember = useCallback(async (member) => {
    try {
      // Set loading state and open modal immediately with current data
      setEditingMember({ ...member, _loading: true });
      setShowEditModal(true);
      
      // Fetch full member details including all fields in background
      const response = await api.get(`/api/family/members/${member._id}`);
      if (response.data.success) {
        setEditingMember(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching member details:', error);
      // Keep the modal open with current data if fetch fails
      setEditingMember({ ...member, _loading: false });
      alert('Could not load complete member details. Showing available data.');
    }
  }, []);

  // Close edit modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
        setEditingMember(null);
      }
    };
    
    if (showEditModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showEditModal]);

  const handleUpdateMember = async (updatedData) => {
    if (!editingMember) return;
    
    try {
      setIsProcessing(true);
      const response = await api.put(
        `/api/family/members/${editingMember._id}`,
        updatedData
      );

      if (response.data.success) {
        setSuccessMessage('Member updated successfully! ✅');
        setShowSuccessModal(true);
        setShowEditModal(false);
        setEditingMember(null);
        await fetchApprovedMembers(adminManagedVansh);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error updating member:', error);
      alert(`Failed to update member: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMember = useCallback((memberId) => {
    setDeletingMemberId(memberId);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteMember = async () => {
    if (!deletingMemberId) return;
    
    try {
      setIsProcessing(true);
      setShowDeleteConfirm(false);
      
      const response = await api.delete(
        `/api/family/members/${deletingMemberId}`
      );

      if (response.data.success) {
        setSuccessMessage('Member deleted successfully! 🗑️');
        setShowSuccessModal(true);
        setDeletingMemberId(null);
        await fetchApprovedMembers(adminManagedVansh);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error deleting member:', error);
      alert(`Failed to delete member: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date'; // Fallback for invalid dates
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Helper function to get full name from registration
  const getFullName = (registration) => {
    const pd = registration.personalDetails;
    if (!pd) return 'Unknown';
    return `${pd.firstName || ''} ${pd.middleName || ''} ${pd.lastName || ''}`.trim();
  };

  // Helper function to get parent name
  const getParentName = (registration) => {
    const pi = registration.parentsInformation;
    if (!pi) return 'N/A';
    return `${pi.fatherFirstName || ''} ${pi.fatherLastName || ''}`.trim() || 
           `${pi.motherFirstName || ''} ${pi.motherLastName || ''}`.trim() || 
           'N/A';
  };

  // Helper to get full address
  const getAddress = (registration) => {
    const pd = registration.personalDetails;
    if (!pd) return 'N/A';
    return `${pd.city || ''}, ${pd.state || ''}`.trim() || 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <LoadingSpinner />
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-10 py-6 shadow-2xl border-2 border-orange-200">
            <p className="text-2xl font-bold text-center text-red-600 mb-2">
              Loading Admin Dashboard...
            </p>
            <p className="text-base font-semibold text-center text-gray-800">
              Fetching registrations and member data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <p className="text-red-600 text-xl font-semibold">{error}</p>
          <button 
            onClick={fetchRegistrations}
            className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (adminManagedVansh === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-12 shadow-2xl text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-800 text-xl font-semibold">Loading admin dashboard...</p>
          <p className="text-gray-600 text-sm mt-2">Retrieving your access permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-purple-600">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-orange-300/20 rounded-full blur-xl"></div>
      
      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-md shadow-xl border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">GogateKulMandal Heritage</h1>
                <p className="text-gray-600">Family Registration Management System</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>Admin Panel</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-800">Heritage Administrator</p>
              </div>
              <Bell className="w-7 h-7 text-orange-600 cursor-pointer hover:text-orange-700 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-orange-300/60 hover:shadow-3xl hover:scale-105 transition-all duration-300 transform">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-base font-semibold mb-2">Pending Requests</p>
                <p className="text-5xl font-bold text-orange-600 mb-2">{allPendingRegistrations.length}</p>
                <p className="text-sm text-orange-500 font-medium">Awaiting review</p>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-4 shadow-lg">
                <Clock className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-green-300/60 hover:shadow-3xl hover:scale-105 transition-all duration-300 transform">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-base font-semibold mb-2">Approved Members</p>
                <p className="text-5xl font-bold text-green-600 mb-2">{allApprovedMembers.length}</p>
                <p className="text-sm text-green-500 font-medium">Active members</p>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 shadow-lg">
                <UserCheck className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-purple-300/60 hover:shadow-3xl hover:scale-105 transition-all duration-300 transform">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-base font-semibold mb-2">Rejected</p>
                <p className="text-5xl font-bold text-purple-600 mb-2">{rejectedMembers.length}</p>
                <p className="text-sm text-purple-500 font-medium">All time</p>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 shadow-lg">
                <UserX className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Management Panel */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-orange-200/50">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-0 px-6 overflow-x-auto">
              {[
                { id: 'pending', label: 'Pending Requests', count: pendingRegistrations.length },
                { id: 'approved', label: 'Approved Members', count: approvedMembers.length },
                { id: 'rejected', label: 'Rejected', count: filteredRejectedMembers.length },
                { id: 'news', label: 'News', count: newsItems.length },
                { id: 'events', label: 'Events', count: eventsItems.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-4 font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.label}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search and Controls */}
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Name or email..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {selectedMembers.length > 0 && activeTab === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    Bulk Approve ({selectedMembers.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                    Bulk Reject ({selectedMembers.length})
                  </button>
                </div>
              )}

              {activeTab === 'rejected' && rejectedMembers.length > 0 && (
                <button
                  onClick={handleClearRejectedList}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear List ({rejectedMembers.length})
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'pending' && (
              <div className="space-y-6">
                {pendingRegistrations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold">
                      {searchTerm ? 'No pending registrations found' : 'No pending registrations'}
                    </p>
                    <p className="text-sm mt-2">
                      {searchTerm ? 'Try adjusting your search criteria' : 'All registrations have been reviewed'}
                    </p>
                  </div>
                ) : (
                  <>
                    {paginatedPendingRegistrations.map((request) => {
                    const fullName = getFullName(request);
                    const parentName = getParentName(request);
                    const address = getAddress(request);
                    const pd = request.personalDetails || {};

                    return (
                      <div
                        key={request._id}
                        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(request._id)}
                              onChange={() => toggleMemberSelection(request._id)}
                              className="mt-2 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-xl font-bold text-gray-800">{fullName}</h3>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  request.status === 'under_review' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {request.status === 'under_review' ? 'Under Review' : 'Pending'}
                                </span>
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                  Vansh {pd.vansh || 'N/A'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700 mb-4">
                                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                                  <Mail className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">{pd.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                                  <Phone className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">{pd.mobileNumber || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                                  <MapPin className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">{address}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                                  <User className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">{pd.gender || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                                  <Calendar className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">DOB: {formatDate(pd.dateOfBirth)}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                                  <FileText className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">Profession: {pd.profession || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="bg-white/70 rounded-lg p-3 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="font-semibold text-gray-600">Parent:</span>
                                    <span className="ml-2 text-gray-800">{parentName}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-600">Marital Status:</span>
                                    <span className="ml-2 text-gray-800">{pd.everMarried === 'yes' ? 'Married' : 'Unmarried'}</span>
                                  </div>
                                  <div className="md:col-span-2">
                                    <span className="font-semibold text-gray-600">Submitted:</span>
                                    <span className="ml-2 text-gray-800">{formatDate(request.createdAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {request.adminNotes && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                                  <p className="text-sm text-blue-800">
                                    <strong>Admin Notes:</strong> {request.adminNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 ml-6">
                            <button
                              onClick={() => handleViewDetails(request, 'pending')}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleApprove(request._id, request)}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request._id, request)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="space-y-4">
                {approvedMembers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold">
                      {searchTerm ? 'No approved members found' : 'No approved members'}
                    </p>
                    <p className="text-sm mt-2">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Approve pending registrations to see them here'}
                    </p>
                  </div>
                ) : (
                  <>
                    {paginatedApprovedMembers.map((member) => (
                      <MemberCard
                        key={member._id}
                        member={member}
                        onEdit={handleEditMember}
                        onDelete={handleDeleteMember}
                        onView={(m) => handleViewDetails(m, 'approved')}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'rejected' && (
              <div className="space-y-4">
                {filteredRejectedMembers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UserX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold">
                      {searchTerm ? 'No rejected registrations found' : 'No rejected registrations'}
                    </p>
                    <p className="text-sm mt-2">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Rejected registrations will appear here'}
                    </p>
                  </div>
                ) : (
                  <>
                    {paginatedRejectedMembers.map((request) => {
                    const fullName = getFullName(request);
                    const pd = request.personalDetails || {};

                    return (
                      <div
                        key={request._id}
                        className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-800">{fullName}</h3>
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                Rejected
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-3">
                              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                                <Mail className="w-4 h-4 text-red-500" />
                                <span className="font-medium">{pd.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                                <Calendar className="w-4 h-4 text-red-500" />
                                <span className="font-medium">Rejected: {formatDate(request.rejectedAt)}</span>
                              </div>
                            </div>
                            {request.adminNotes && (
                              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                                <p className="text-sm text-red-800">
                                  <strong>Reason:</strong> {request.adminNotes}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewDetails(request, 'rejected')}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {activeTab === 'pending' && pendingRegistrations.length > 0 && (
            <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: getTotalPages(pendingRegistrations) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-orange-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-orange-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === getTotalPages(pendingRegistrations)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === getTotalPages(pendingRegistrations)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === 'approved' && approvedMembers.length > 0 && (
            <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: getTotalPages(approvedMembers) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === getTotalPages(approvedMembers)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === getTotalPages(approvedMembers)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rejected' && filteredRejectedMembers.length > 0 && (
            <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: getTotalPages(filteredRejectedMembers) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-purple-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === getTotalPages(filteredRejectedMembers)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === getTotalPages(filteredRejectedMembers)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Manage News</h3>
                <button
                  onClick={() => {
                    setEditingNews(null);
                    setShowNewsModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  + Add New News
                </button>
              </div>

              {newsItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No news items yet. Click "Add New News" to create one.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {newsItems.map((news) => (
                    <div key={news._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{news.title}</h4>
                          <p className="text-gray-600 mb-3 line-clamp-2">{news.content}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{news.category || 'General'}</span>
                            <span>📅 {new Date(news.publishDate || news.createdAt).toLocaleDateString()}</span>
                            {news.authorName && <span>✍️ By: {news.authorName}</span>}
                            {(news.vansh || news.authorVanshNo || news.createdByVanshNo) && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                                Vansh {news.vansh || news.authorVanshNo || news.createdByVanshNo}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const response = await api.get(`/api/news/${news._id}`);
                              if (response.data.success) {
                                console.log('Fetched news data:', response.data.data);
                                console.log('Images array:', response.data.data.images);
                                setSelectedNews(response.data.data);
                              }
                            } catch (error) {
                              console.error('Error fetching news details:', error);
                              alert('Failed to load news details');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Manage Events</h3>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setShowEventModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  + Add New Event
                </button>
              </div>

              {eventsItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No events yet. Click "Add New Event" to create one.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {eventsItems.map((event) => (
                    <div key={event._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h4>
                          <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{event.eventType || 'Event'}</span>
                            <span>📅 {new Date(event.date || event.startDate).toLocaleDateString()}</span>
                            <span>⏰ {event.fromTime || event.startTime}</span>
                            {event.venue && <span>📍 {event.venue.name || event.venue}</span>}
                            {(event.authorName || event.createdByName) && (
                              <span>✍️ By: {event.authorName || event.createdByName}</span>
                            )}
                            {(event.vansh || event.createdByVanshNo || event.authorVanshNo) && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                                Vansh {event.vansh || event.createdByVanshNo || event.authorVanshNo}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const response = await api.get(`/api/events/${event._id}`);
                              if (response.data.success) {
                                console.log('Fetched event data:', response.data.data);
                                console.log('Images array:', response.data.data.images);
                                console.log('Event image field:', response.data.data.eventImage);
                                setSelectedEvent(response.data.data);
                              }
                            } catch (error) {
                              console.error('Error fetching event details:', error);
                              alert('Failed to load event details');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingNews ? 'Edit News' : 'Create New News'}
                </h3>
                <button
                  onClick={() => {
                    setShowNewsModal(false);
                    setEditingNews(null);
                    setNewsFormImages([]);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newsData = {
                  title: formData.get('title'),
                  content: formData.get('content'),
                  summary: formData.get('summary'),
                  category: formData.get('category'),
                  priority: formData.get('priority'),
                  tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [],
                  images: newsFormImages,
                  visibleToAllVansh: formData.get('visibleToAllVansh') === 'on'
                };
                
                if (editingNews) {
                  handleUpdateNews(editingNews._id, newsData);
                } else {
                  handleCreateNews(newsData);
                }
              }}
              className="p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingNews?.title || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                  <textarea
                    name="content"
                    defaultValue={editingNews?.content || ''}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                  <textarea
                    name="summary"
                    defaultValue={editingNews?.summary || ''}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      defaultValue={editingNews?.category || 'General'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="General">General</option>
                      <option value="Announcement">Announcement</option>
                      <option value="Achievement">Achievement</option>
                      <option value="Milestone">Milestone</option>
                      <option value="Memorial">Memorial</option>
                      <option value="Celebration">Celebration</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      defaultValue={editingNews?.priority || 'Medium'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="visibleToAllVansh"
                    id="eventVisibleToAllVansh"
                    defaultChecked={editingEvent?.visibleToAllVansh !== false}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="eventVisibleToAllVansh" className="text-sm font-medium text-gray-700 cursor-pointer">
                    📢 Publish to all vanshes (visible to everyone)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="space-y-3">
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm font-medium inline-block">
                      + Add Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files);
                          if (files.length === 0) return;
                          
                          try {
                            const newImages = [];
                            for (const file of files) {
                              const compressed = await compressImage(file);
                              const reader = new FileReader();
                              const base64 = await new Promise((resolve) => {
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(compressed);
                              });
                              newImages.push(base64);
                            }
                            setNewsFormImages([...newsFormImages, ...newImages]);
                          } catch (error) {
                            console.error('Error processing images:', error);
                            alert('Failed to process images');
                          }
                        }}
                      />
                    </label>
                    {newsFormImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {newsFormImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setNewsFormImages(newsFormImages.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingNews?.tags?.join(', ') || ''}
                    placeholder="e.g., family, tradition, celebration"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewsModal(false);
                    setEditingNews(null);
                    setNewsFormImages([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Saving...' : editingNews ? 'Update News' : 'Create News'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    setEventFormImages([]);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const eventData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  eventType: formData.get('eventType'),
                  date: formData.get('date'),
                  fromTime: formData.get('fromTime'),
                  toTime: formData.get('toTime'),
                  venue: formData.get('venue'),
                  eventImage: eventFormImages,
                  visibleToAllVansh: formData.get('visibleToAllVansh') === 'on'
                };
                
                if (editingEvent) {
                  handleUpdateEvent(editingEvent._id, eventData);
                } else {
                  handleCreateEvent(eventData);
                }
              }}
              className="p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingEvent?.title || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    name="description"
                    defaultValue={editingEvent?.description || ''}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                    <select
                      name="eventType"
                      defaultValue={editingEvent?.eventType || 'Cultural'}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Birthday">Birthday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Festival">Festival</option>
                      <option value="Reunion">Reunion</option>
                      <option value="Memorial">Memorial</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Religious">Religious</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={editingEvent?.date ? new Date(editingEvent.date).toISOString().split('T')[0] : ''}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      name="fromTime"
                      defaultValue={editingEvent?.fromTime || ''}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      name="toTime"
                      defaultValue={editingEvent?.toTime || ''}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="space-y-3">
                    <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors text-sm font-medium inline-block">
                      + Add Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files);
                          if (files.length === 0) return;
                          
                          try {
                            const newImages = [];
                            for (const file of files) {
                              const compressed = await compressImage(file);
                              const reader = new FileReader();
                              const base64 = await new Promise((resolve) => {
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(compressed);
                              });
                              newImages.push(base64);
                            }
                            setEventFormImages([...eventFormImages, ...newImages]);
                          } catch (error) {
                            console.error('Error processing images:', error);
                            alert('Failed to process images');
                          }
                        }}
                      />
                    </label>
                    {eventFormImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {eventFormImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setEventFormImages(eventFormImages.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    defaultValue={editingEvent?.venue?.name || editingEvent?.venue || ''}
                    required
                    placeholder="Event location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    setEventFormImages([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal - User Registration Details */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 p-8 border-b border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{getFullName(selectedRequest)}</h2>
                  <p className="text-gray-600">Registration Details</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-3 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {loadingDetails && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <span className="text-gray-600">Loading full details with images...</span>
                  </div>
                </div>
              )}
              
              {/* Personal Details Section */}
              {selectedRequest.personalDetails && (
                <div className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(selectedRequest.personalDetails)
                      .filter(([key]) => !['profileImage', '__v'].includes(key))
                      .map(([key, value]) => (
                        <DataField key={key} label={key} value={value} />
                      ))}
                  </div>
                </div>
              )}

              {/* Parents Information Section */}
              {selectedRequest.parentsInformation && (
                <div className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Parents Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(selectedRequest.parentsInformation)
                      .filter(([key]) => !['fatherProfileImage', 'motherProfileImage', '__v'].includes(key))
                      .map(([key, value]) => (
                        <DataField key={key} label={key} value={value} />
                      ))}
                  </div>
                </div>
              )}

              {/* Spouse Information Section */}
              {selectedRequest.spouseInformation && Object.keys(selectedRequest.spouseInformation).length > 0 && (
                <div className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Spouse Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(selectedRequest.spouseInformation)
                      .filter(([key]) => !['profileImage', '__v'].includes(key))
                      .map(([key, value]) => (
                        <DataField key={key} label={key} value={value} />
                      ))}
                  </div>
                </div>
              )}

              {/* Children Information Section */}
              {selectedRequest.childrenInformation && selectedRequest.childrenInformation.length > 0 && (
                <div className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Children Information</h3>
                  {selectedRequest.childrenInformation.map((child, index) => (
                    <div key={index} className="mb-6 pb-6 border-b last:border-b-0 last:mb-0 last:pb-0">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Child {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(child)
                          .filter(([key]) => !['_id', 'profileImage', '__v'].includes(key))
                          .map(([key, value]) => (
                            <DataField key={key} label={key} value={value} />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other Sections - Display any remaining fields */}
              {Object.entries(selectedRequest)
                .filter(([key]) => !['_id', 'createdAt', 'updatedAt', '__v', 'status', 'adminNotes', 'reviewedAt', 'personalDetails', 'parentsInformation', 'spouseInformation', 'childrenInformation', '_sheetRowKey', 'password'].includes(key))
                .map(([sectionKey, sectionValue]) => {
                  if (!sectionValue || (typeof sectionValue === 'object' && Object.keys(sectionValue).length === 0)) return null;
                  
                  return (
                    <div key={sectionKey} className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
                        {sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h3>
                      {typeof sectionValue === 'object' && !Array.isArray(sectionValue) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(sectionValue)
                            .filter(([key]) => !['_id', '__v'].includes(key))
                            .map(([key, value]) => (
                              <DataField key={key} label={key} value={value} />
                            ))}
                        </div>
                      ) : Array.isArray(sectionValue) ? (
                        sectionValue.map((item, idx) => (
                          <div key={idx} className="mb-4 pb-4 border-b last:border-b-0 last:mb-0 last:pb-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {typeof item === 'object' ? (
                                Object.entries(item)
                                  .filter(([key]) => !['_id', '__v'].includes(key))
                                  .map(([key, value]) => (
                                    <DataField key={key} label={key} value={value} />
                                  ))
                              ) : (
                                <DataField label={`Item ${idx + 1}`} value={item} />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <DataField label={sectionKey} value={sectionValue} />
                      )}
                    </div>
                  );
                })
              }
            </div>
            
            <div className="p-8 border-t border-gray-200 bg-gray-50/50 flex gap-4 justify-end rounded-b-3xl">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setViewSourceTab(null);
                }}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              >
                Close
              </button>
              
              {/* Show Approve/Reject buttons only for pending requests */}
              {viewSourceTab === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleReject(selectedRequest._id, selectedRequest);
                      setSelectedRequest(null);
                      setViewSourceTab(null);
                    }}
                    className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 font-semibold transition-all"
                  >
                    <X className="w-5 h-5" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest._id, selectedRequest);
                      setSelectedRequest(null);
                      setViewSourceTab(null);
                    }}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 font-semibold transition-all"
                  >
                    <Check className="w-5 h-5" />
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* First Confirmation for Rejection */}
      {showBulkConfirm && bulkAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  bulkAction.action === 'approve' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <AlertCircle className={`w-8 h-8 ${
                    bulkAction.action === 'approve' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {bulkAction.action === 'approve' 
                    ? `Bulk Approve ${bulkAction.count} Registration(s)?`
                    : `Bulk Reject ${bulkAction.count} Registration(s)?`
                  }
                </h3>
                <p className="text-gray-600">
                  {bulkAction.action === 'approve'
                    ? `This will approve ${bulkAction.count} registration(s) and move them to the members collection. Email notifications will be sent.`
                    : `This will reject ${bulkAction.count} registration(s) and move them to the rejected list.`
                  }
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkConfirm(false);
                    setBulkAction(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkAction}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-all ${
                    bulkAction.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  Yes, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Rejected List Confirmation Modal */}
      {showClearRejectedConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-purple-100">
                  <AlertCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Clear All Rejected Members?
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to clear all <strong>{rejectedMembers.length}</strong> rejected member(s)? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearRejectedConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearRejectedList}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
                >
                  Yes, Clear List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmReject && pendingRejection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-orange-100">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Are you sure you want to reject?
                </h3>
                <p className="text-gray-600">
                  This action will move the registration for{' '}
                  <span className="font-semibold">{getFullName(pendingRejection.data)}</span> to the rejected list.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmReject(false);
                    setPendingRejection(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all"
                >
                  Yes, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && approvalAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  approvalAction.type === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {approvalAction.type === 'approve' ? (
                    <Check className="w-8 h-8 text-green-600" />
                  ) : (
                    <X className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {approvalAction.type === 'approve' ? 'Approve Registration' : 'Reject Registration'}
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to {approvalAction.type} the registration for{' '}
                  <span className="font-semibold">{getFullName(approvalAction.data)}</span>?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-all ${
                    approvalAction.type === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalAction.type === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing/Loading Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl px-12 py-10 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xl font-semibold text-gray-800">Processing...</p>
              <p className="text-sm text-gray-600">Please wait while we update the registration</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-100">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-green-600">
                {successMessage}
              </h3>
              <p className="text-gray-600 mb-6">
                {successMessage.includes('updated') 
                  ? 'The member information has been updated successfully.' 
                  : successMessage.includes('deleted') 
                  ? 'The member has been removed from the system.'
                  : successMessage.includes('cleared')
                  ? 'All rejected members have been cleared from the list.'
                  : successMessage.includes('Approved') 
                  ? 'The registration has been approved and moved to members collection.' 
                  : 'The operation completed successfully.'}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
                className="px-6 py-3 rounded-xl text-white font-semibold transition-all bg-green-600 hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Delete Member?
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this member? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingMemberId(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMember}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal - Comprehensive with all fields */}
      {showEditModal && editingMember && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingMember(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Edit Member - Complete Record</h3>
                <p className="text-sm text-gray-600 mt-1">All fields are editable. Leave empty to keep current value.</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {editingMember._loading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                  <p className="text-blue-700 text-sm">⏳ Loading complete member details...</p>
                </div>
              )}
              <form 
                key={`${editingMember._id}-${editingMember._loading ? 'loading' : 'loaded'}`}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedData = {
                    personalDetails: {},
                    parentsInformation: {},
                    marriedDetails: {}
                  };
                
                  // Process file uploads separately
                  const profileImageFile = formData.get('pd_profileImage');
                  const fatherImageFile = formData.get('pi_fatherProfileImage');
                  const motherImageFile = formData.get('pi_motherProfileImage');
                  const spouseImageFile = formData.get('md_spouseProfileImage');
                  
                  // Compress and convert images to base64 if new files are uploaded
                  if (profileImageFile && profileImageFile.size > 0) {
                    try {
                      const compressed = await compressImage(profileImageFile);
                      const reader = new FileReader();
                      const base64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(compressed);
                      });
                      updatedData.personalDetails.profileImage = base64;
                    } catch (error) {
                      console.error('Error compressing profile image:', error);
                    }
                  }
                  
                  if (fatherImageFile && fatherImageFile.size > 0) {
                    try {
                      const compressed = await compressImage(fatherImageFile);
                      const reader = new FileReader();
                      const base64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(compressed);
                      });
                      updatedData.parentsInformation.fatherProfileImage = base64;
                    } catch (error) {
                      console.error('Error compressing father image:', error);
                    }
                  }
                  
                  if (motherImageFile && motherImageFile.size > 0) {
                    try {
                      const compressed = await compressImage(motherImageFile);
                      const reader = new FileReader();
                      const base64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(compressed);
                      });
                      updatedData.parentsInformation.motherProfileImage = base64;
                    } catch (error) {
                      console.error('Error compressing mother image:', error);
                    }
                  }
                  
                  if (spouseImageFile && spouseImageFile.size > 0) {
                    try {
                      const compressed = await compressImage(spouseImageFile);
                      const reader = new FileReader();
                      const base64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(compressed);
                      });
                      updatedData.marriedDetails.spouseProfileImage = base64;
                    } catch (error) {
                      console.error('Error compressing spouse image:', error);
                    }
                  }
                
                  formData.forEach((value, key) => {
                    // Skip file inputs as they're handled separately above
                    if (key.includes('ProfileImage') || key.includes('profileImage')) {
                      return;
                    }
                    
                    // Only include fields with actual values (skip empty strings)
                    if (value !== '' && value !== null && value !== undefined) {
                      if (key.startsWith('pd_')) {
                        updatedData.personalDetails[key.replace('pd_', '')] = value;
                      } else if (key.startsWith('pi_')) {
                        updatedData.parentsInformation[key.replace('pi_', '')] = value;
                      } else if (key.startsWith('md_')) {
                        updatedData.marriedDetails[key.replace('md_', '')] = value;
                      } else {
                        updatedData[key] = value;
                      }
                    } else if (key === 'adminNotes') {
                      // Allow adminNotes to be explicitly emptied
                      updatedData[key] = value;
                    }
                  });
                
                  // Remove empty nested objects
                  if (Object.keys(updatedData.personalDetails).length === 0) {
                    delete updatedData.personalDetails;
                  }
                  if (Object.keys(updatedData.parentsInformation).length === 0) {
                    delete updatedData.parentsInformation;
                  }
                  if (Object.keys(updatedData.marriedDetails).length === 0) {
                    delete updatedData.marriedDetails;
                  }
                
                  // Convert numeric fields
                  if (updatedData.serNo) updatedData.serNo = parseInt(updatedData.serNo);
                  if (updatedData.fatherSerNo) {
                    updatedData.fatherSerNo = parseInt(updatedData.fatherSerNo);
                    // Sync to parentsInformation as well
                    if (!updatedData.parentsInformation) updatedData.parentsInformation = {};
                    updatedData.parentsInformation.fatherSerNo = updatedData.fatherSerNo;
                  }
                  if (updatedData.motherSerNo) {
                    updatedData.motherSerNo = parseInt(updatedData.motherSerNo);
                    // Sync to parentsInformation as well
                    if (!updatedData.parentsInformation) updatedData.parentsInformation = {};
                    updatedData.parentsInformation.motherSerNo = updatedData.motherSerNo;
                  }
                  if (updatedData.spouseSerNo) updatedData.spouseSerNo = parseInt(updatedData.spouseSerNo);
                  if (updatedData.level) updatedData.level = parseInt(updatedData.level);
                
                  // Handle childrenSerNos - convert comma-separated string to array of numbers
                  if (updatedData.childrenSerNos) {
                    const childrenStr = updatedData.childrenSerNos.trim();
                    if (childrenStr) {
                      updatedData.childrenSerNos = childrenStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    } else {
                      updatedData.childrenSerNos = [];
                    }
                  }
                
                  handleUpdateMember(updatedData);
                }}>
                
                {/* Basic Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                      <label className="block text-sm font-bold text-orange-700 mb-1">
                        Serial Number (serNo) * 🔢
                      </label>
                      <input
                        type="number"
                        name="serNo"
                        defaultValue={editingMember.serNo || ''}
                        required
                        className="w-full px-4 py-2 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-bold text-lg"
                      />
                      <p className="text-xs text-orange-600 mt-1">Unique identifier for this member</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vansh</label>
                      <input
                        type="text"
                        name="vansh"
                        defaultValue={editingMember.personalDetails?.vansh || editingMember.vansh || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <input
                        type="number"
                        name="level"
                        defaultValue={editingMember.level || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="pd_firstName"
                        defaultValue={editingMember.personalDetails?.firstName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        name="pd_middleName"
                        defaultValue={editingMember.personalDetails?.middleName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="pd_lastName"
                        defaultValue={editingMember.personalDetails?.lastName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        name="pd_gender"
                        defaultValue={editingMember.personalDetails?.gender || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="pd_dateOfBirth"
                        defaultValue={editingMember.personalDetails?.dateOfBirth ? new Date(editingMember.personalDetails.dateOfBirth).toISOString().split('T')[0] : ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Is Alive</label>
                      <select
                        name="pd_isAlive"
                        defaultValue={editingMember.personalDetails?.isAlive || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="pd_email"
                        defaultValue={editingMember.personalDetails?.email || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        name="pd_mobileNumber"
                        defaultValue={editingMember.personalDetails?.mobileNumber || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ever Married</label>
                      <select
                        name="pd_everMarried"
                        defaultValue={editingMember.personalDetails?.everMarried || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                      <input
                        type="text"
                        name="pd_qualifications"
                        defaultValue={editingMember.personalDetails?.qualifications || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                      <input
                        type="text"
                        name="pd_profession"
                        defaultValue={editingMember.personalDetails?.profession || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          name="pd_profileImage"
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedBlob = await compressImage(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const preview = document.getElementById('preview-pd-profile');
                                  if (preview) preview.src = reader.result;
                                };
                                reader.readAsDataURL(compressedBlob);
                              } catch (error) {
                                console.error('Compression failed:', error);
                              }
                            }
                          }}
                        />
                        {editingMember.personalDetails?.profileImage && (
                          <img
                            id="preview-pd-profile"
                            src={`data:${editingMember.personalDetails.profileImage.mimeType};base64,${editingMember.personalDetails.profileImage.data}`}
                            alt="Profile"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload a new photo to change (max 800x800px, compressed to ~50-100KB)</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="pd_country"
                        defaultValue={editingMember.personalDetails?.country || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="pd_state"
                        defaultValue={editingMember.personalDetails?.state || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <input
                        type="text"
                        name="pd_district"
                        defaultValue={editingMember.personalDetails?.district || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="pd_city"
                        defaultValue={editingMember.personalDetails?.city || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                      <input
                        type="text"
                        name="pd_area"
                        defaultValue={editingMember.personalDetails?.area || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                      <input
                        type="text"
                        name="pd_pinCode"
                        defaultValue={editingMember.personalDetails?.pinCode || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Parents Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Parents Information</h4>
                  
                  {/* Father Details */}
                  <h5 className="text-md font-semibold text-gray-700 mb-3 mt-4">Father Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father SerNo</label>
                      <input
                        type="number"
                        name="fatherSerNo"
                        defaultValue={editingMember.fatherSerNo || editingMember.parentsInformation?.fatherSerNo || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father First Name</label>
                      <input
                        type="text"
                        name="pi_fatherFirstName"
                        defaultValue={editingMember.parentsInformation?.fatherFirstName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father Middle Name</label>
                      <input
                        type="text"
                        name="pi_fatherMiddleName"
                        defaultValue={editingMember.parentsInformation?.fatherMiddleName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father Last Name</label>
                      <input
                        type="text"
                        name="pi_fatherLastName"
                        defaultValue={editingMember.parentsInformation?.fatherLastName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father Email</label>
                      <input
                        type="email"
                        name="pi_fatherEmail"
                        defaultValue={editingMember.parentsInformation?.fatherEmail || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father Mobile Number</label>
                      <input
                        type="tel"
                        name="pi_fatherMobileNumber"
                        defaultValue={editingMember.parentsInformation?.fatherMobileNumber || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father Date of Birth</label>
                      <input
                        type="date"
                        name="pi_fatherDateOfBirth"
                        defaultValue={editingMember.parentsInformation?.fatherDateOfBirth ? new Date(editingMember.parentsInformation.fatherDateOfBirth).toISOString().split('T')[0] : ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          name="pi_fatherProfileImage"
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedBlob = await compressImage(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const preview = document.getElementById('preview-father-profile');
                                  if (preview) preview.src = reader.result;
                                };
                                reader.readAsDataURL(compressedBlob);
                              } catch (error) {
                                console.error('Compression failed:', error);
                              }
                            }
                          }}
                        />
                        {editingMember.parentsInformation?.fatherProfileImage && (
                          <img
                            id="preview-father-profile"
                            src={`data:${editingMember.parentsInformation.fatherProfileImage.mimeType};base64,${editingMember.parentsInformation.fatherProfileImage.data}`}
                            alt="Father"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload a new photo to change (compressed to ~50-100KB)</p>
                    </div>
                  </div>
                  
                  {/* Mother Details */}
                  <h5 className="text-md font-semibold text-gray-700 mb-3 mt-6">Mother Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother SerNo</label>
                      <input
                        type="number"
                        name="motherSerNo"
                        defaultValue={editingMember.motherSerNo || editingMember.parentsInformation?.motherSerNo || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother First Name</label>
                      <input
                        type="text"
                        name="pi_motherFirstName"
                        defaultValue={editingMember.parentsInformation?.motherFirstName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Middle Name</label>
                      <input
                        type="text"
                        name="pi_motherMiddleName"
                        defaultValue={editingMember.parentsInformation?.motherMiddleName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Last Name</label>
                      <input
                        type="text"
                        name="pi_motherLastName"
                        defaultValue={editingMember.parentsInformation?.motherLastName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Email</label>
                      <input
                        type="email"
                        name="pi_motherEmail"
                        defaultValue={editingMember.parentsInformation?.motherEmail || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Mobile Number</label>
                      <input
                        type="tel"
                        name="pi_motherMobileNumber"
                        defaultValue={editingMember.parentsInformation?.motherMobileNumber || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Date of Birth</label>
                      <input
                        type="date"
                        name="pi_motherDateOfBirth"
                        defaultValue={editingMember.parentsInformation?.motherDateOfBirth ? new Date(editingMember.parentsInformation.motherDateOfBirth).toISOString().split('T')[0] : ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          name="pi_motherProfileImage"
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedBlob = await compressImage(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const preview = document.getElementById('preview-mother-profile');
                                  if (preview) preview.src = reader.result;
                                };
                                reader.readAsDataURL(compressedBlob);
                              } catch (error) {
                                console.error('Compression failed:', error);
                              }
                            }
                          }}
                        />
                        {editingMember.parentsInformation?.motherProfileImage && (
                          <img
                            id="preview-mother-profile"
                            src={`data:${editingMember.parentsInformation.motherProfileImage.mimeType};base64,${editingMember.parentsInformation.motherProfileImage.data}`}
                            alt="Mother"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload a new photo to change (compressed to ~50-100KB)</p>
                    </div>
                  </div>
                </div>

                {/* Marriage Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Marriage Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse SerNo</label>
                      <input
                        type="number"
                        name="spouseSerNo"
                        defaultValue={editingMember.spouseSerNo || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse First Name</label>
                      <input
                        type="text"
                        name="md_spouseFirstName"
                        defaultValue={editingMember.marriedDetails?.spouseFirstName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Last Name</label>
                      <input
                        type="text"
                        name="md_spouseLastName"
                        defaultValue={editingMember.marriedDetails?.spouseLastName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Marriage</label>
                      <input
                        type="date"
                        name="md_dateOfMarriage"
                        defaultValue={editingMember.marriedDetails?.dateOfMarriage ? new Date(editingMember.marriedDetails.dateOfMarriage).toISOString().split('T')[0] : ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        defaultValue={editingMember.username || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password (leave empty to keep current)</label>
                      <input
                        type="text"
                        name="password"
                        placeholder="Enter new password or leave empty"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Spouse SerNo and Additional Marriage Details */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Additional Spouse Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse SerNo</label>
                      <input
                        type="number"
                        name="spouseSerNo"
                        defaultValue={editingMember.spouseSerNo || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Middle Name</label>
                      <input
                        type="text"
                        name="md_spouseMiddleName"
                        defaultValue={editingMember.marriedDetails?.spouseMiddleName || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Email</label>
                      <input
                        type="email"
                        name="md_spouseEmail"
                        defaultValue={editingMember.marriedDetails?.spouseEmail || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Mobile Number</label>
                      <input
                        type="tel"
                        name="md_spouseMobileNumber"
                        defaultValue={editingMember.marriedDetails?.spouseMobileNumber || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Date of Birth</label>
                      <input
                        type="date"
                        name="md_spouseDateOfBirth"
                        defaultValue={editingMember.marriedDetails?.spouseDateOfBirth ? new Date(editingMember.marriedDetails.spouseDateOfBirth).toISOString().split('T')[0] : ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Gender</label>
                      <select
                        name="md_spouseGender"
                        defaultValue={editingMember.marriedDetails?.spouseGender || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          name="md_spouseProfileImage"
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedBlob = await compressImage(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const preview = document.getElementById('preview-spouse-profile');
                                  if (preview) preview.src = reader.result;
                                };
                                reader.readAsDataURL(compressedBlob);
                              } catch (error) {
                                console.error('Compression failed:', error);
                              }
                            }
                          }}
                        />
                        {editingMember.marriedDetails?.spouseProfileImage && (
                          <img
                            id="preview-spouse-profile"
                            src={`data:${editingMember.marriedDetails.spouseProfileImage.mimeType};base64,${editingMember.marriedDetails.spouseProfileImage.data}`}
                            alt="Spouse"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload a new photo to change (compressed to ~50-100KB)</p>
                    </div>
                  </div>
                </div>

                {/* Children SerNos */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-300">Children Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Children SerNos (comma-separated)</label>
                      <input
                        type="text"
                        name="childrenSerNos"
                        defaultValue={
                          Array.isArray(editingMember.childrenSerNos) 
                            ? editingMember.childrenSerNos.join(', ') 
                            : (editingMember.childrenSerNos || '')
                        }
                        placeholder="e.g., 5, 6, 7"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter serial numbers separated by commas</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 bg-gray-50 p-4 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                  >
                    ✕ Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* News Detail Modal with Full CRUD */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 p-8 border-b border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedNews.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {selectedNews.category || 'General'}
                    </span>
                    <span>📅 {new Date(selectedNews.publishDate || selectedNews.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="p-3 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Details Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedNews.authorName || selectedNews.createdByName) && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Published By</p>
                        <p className="font-semibold text-gray-800">{selectedNews.authorName || selectedNews.createdByName}</p>
                      </div>
                    </div>
                  )}
                  {(selectedNews.vansh || selectedNews.authorVanshNo || selectedNews.createdByVanshNo) && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vansh Number</p>
                        <p className="font-semibold text-orange-700">Vansh {selectedNews.vansh || selectedNews.authorVanshNo || selectedNews.createdByVanshNo}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Published Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedNews.publishDate || selectedNews.createdAt).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold text-gray-800">{selectedNews.category || 'General'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Content
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNews.content}</p>
                {selectedNews.summary && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900">Summary:</p>
                    <p className="text-blue-800">{selectedNews.summary}</p>
                  </div>
                )}
              </div>

              {/* Images Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Images ({selectedNews.images?.length || 0})
                  </h3>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm font-medium">
                    + Add Image
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length === 0) return;
                        
                        try {
                          setIsProcessing(true);
                          const newImages = [];
                          
                          for (const file of files) {
                            const compressed = await compressImage(file);
                            const reader = new FileReader();
                            const base64 = await new Promise((resolve) => {
                              reader.onloadend = () => resolve(reader.result);
                              reader.readAsDataURL(compressed);
                            });
                            newImages.push(base64);
                          }
                          
                          const updatedImages = [...(selectedNews.images || []), ...newImages];
                          const response = await api.put(`/api/news/${selectedNews._id}`, {
                            images: updatedImages
                          });
                          
                          if (response.data.success) {
                            setSuccessMessage('Images added successfully! 📷');
                            setShowSuccessModal(true);
                            
                            const refreshResponse = await api.get(`/api/news/${selectedNews._id}`);
                            if (refreshResponse.data.success) {
                              setSelectedNews(refreshResponse.data.data);
                            }
                            
                            setTimeout(() => {
                              setShowSuccessModal(false);
                              setSuccessMessage('');
                            }, 3000);
                          }
                        } catch (error) {
                          console.error('Error uploading images:', error);
                          alert('Failed to upload images');
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedNews.images && selectedNews.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {selectedNews.images.map((img, idx) => {
                      // Handle different image formats: string URL, object with url property, or base64
                      const imageUrl = typeof img === 'string' ? img : (img.url || img.imageUrl || img.image || '');
                      
                      return (
                        <div key={idx} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`News image ${idx + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewingImage({ url: imageUrl, source: img, type: 'news', index: idx })}
                            onError={(e) => {
                              console.log('Image load error:', img);
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No images uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Meta Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className="font-semibold text-gray-800">{selectedNews.priority || 'Medium'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-800">{selectedNews.isPublished ? 'Published' : 'Draft'}</p>
                  </div>
                  {selectedNews.tags && selectedNews.tags.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedNews.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setDeletingNews(selectedNews);
                    setShowDeleteNewsModal(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete News
                </button>
                <button
                  onClick={() => {
                    setEditingNews(selectedNews);
                    setShowNewsModal(true);
                    setSelectedNews(null);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit News
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal with Full CRUD */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 p-8 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedEvent.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-medium">
                      {selectedEvent.eventType || 'Event'}
                    </span>
                    <span>📅 {new Date(selectedEvent.date || selectedEvent.startDate).toLocaleDateString()}</span>
                    <span>⏰ {selectedEvent.fromTime || selectedEvent.startTime}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-3 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Details Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedEvent.createdByName || selectedEvent.authorName) && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created By</p>
                        <p className="font-semibold text-gray-800">{selectedEvent.createdByName || selectedEvent.authorName}</p>
                      </div>
                    </div>
                  )}
                  {(selectedEvent.vansh || selectedEvent.authorVanshNo || selectedEvent.createdByVanshNo) && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vansh Number</p>
                        <p className="font-semibold text-orange-700">Vansh {selectedEvent.vansh || selectedEvent.authorVanshNo || selectedEvent.createdByVanshNo}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedEvent.createdAt).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Event Type</p>
                      <p className="font-semibold text-gray-800">{selectedEvent.eventType || 'Event'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Event Details */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Event Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedEvent.date || selectedEvent.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-semibold text-gray-800">
                        {selectedEvent.fromTime || selectedEvent.startTime} - {selectedEvent.toTime || selectedEvent.endTime}
                      </p>
                    </div>
                  </div>
                  {selectedEvent.venue && (
                    <div className="col-span-2 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Venue</p>
                        <p className="font-semibold text-gray-800">
                          {selectedEvent.venue.name || selectedEvent.venue}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Images Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Images ({(() => {
                      // Count images from both eventImage and images
                      let count = 0;
                      if (selectedEvent.eventImage) {
                        count += Array.isArray(selectedEvent.eventImage) ? selectedEvent.eventImage.length : 1;
                      }
                      if (selectedEvent.images) {
                        count += Array.isArray(selectedEvent.images) ? selectedEvent.images.length : 1;
                      }
                      return count;
                    })()})
                  </h3>
                  <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors text-sm font-medium">
                    + Add Image
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length === 0) return;
                        
                        try {
                          setIsProcessing(true);
                          const newImages = [];
                          
                          for (const file of files) {
                            const compressed = await compressImage(file);
                            const reader = new FileReader();
                            const base64 = await new Promise((resolve) => {
                              reader.onloadend = () => resolve(reader.result);
                              reader.readAsDataURL(compressed);
                            });
                            newImages.push(base64);
                          }
                          
                          // Add to eventImage array (main storage for event images)
                          const currentImages = Array.isArray(selectedEvent.eventImage) 
                            ? selectedEvent.eventImage 
                            : (selectedEvent.eventImage ? [selectedEvent.eventImage] : []);
                          const updatedImages = [...currentImages, ...newImages];
                          
                          const response = await api.put(`/api/events/${selectedEvent._id}`, {
                            eventImage: updatedImages
                          });
                          
                          if (response.data.success) {
                            setSuccessMessage('Images added successfully! 📷');
                            setShowSuccessModal(true);
                            
                            const refreshResponse = await api.get(`/api/events/${selectedEvent._id}`);
                            if (refreshResponse.data.success) {
                              setSelectedEvent(refreshResponse.data.data);
                            }
                            
                            setTimeout(() => {
                              setShowSuccessModal(false);
                              setSuccessMessage('');
                            }, 3000);
                          }
                        } catch (error) {
                          console.error('Error uploading images:', error);
                          alert('Failed to upload images');
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {(() => {
                  // Combine all images from eventImage and images fields
                  const allImages = [];
                  
                  // Handle eventImage - can be array or single value
                  if (selectedEvent.eventImage) {
                    if (Array.isArray(selectedEvent.eventImage)) {
                      selectedEvent.eventImage.forEach(img => allImages.push({ source: img, type: 'eventImage' }));
                    } else {
                      allImages.push({ source: selectedEvent.eventImage, type: 'eventImage' });
                    }
                  }
                  
                  // Handle images array
                  if (selectedEvent.images) {
                    if (Array.isArray(selectedEvent.images)) {
                      selectedEvent.images.forEach(img => allImages.push({ source: img, type: 'images' }));
                    } else {
                      allImages.push({ source: selectedEvent.images, type: 'images' });
                    }
                  }
                  
                  return allImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {allImages.map((imgObj, idx) => {
                        const img = imgObj.source;
                        // Handle different image formats: string (base64 or URL), or object
                        const imageUrl = typeof img === 'string' ? img : (img.url || img.imageUrl || img.image || '');
                        
                        return (
                          <div key={idx} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Event image ${idx + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setViewingImage({ url: imageUrl, source: img, type: 'event', index: idx, fieldType: imgObj.type })}
                              onError={(e) => {
                                console.log('Image load error for', imgObj.type, ':', img);
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No images uploaded yet</p>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setDeletingEvent(selectedEvent);
                    setShowDeleteEventModal(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Event
                </button>
                <button
                  onClick={() => {
                    setEditingEvent(selectedEvent);
                    setShowEventModal(true);
                    setSelectedEvent(null);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <img
              src={viewingImage.url}
              alt="Full size"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />

            {/* Delete button */}
            <button
              onClick={() => {
                setImageToDelete(viewingImage);
                setViewingImage(null);
              }}
              className="absolute bottom-4 right-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Image
            </button>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Delete Image?</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                <img
                  src={imageToDelete.url}
                  alt="Image to delete"
                  className="w-full max-h-64 object-contain rounded-lg mb-3"
                />
                <p className="text-sm text-gray-600">
                  Image {imageToDelete.index + 1} from {imageToDelete.type === 'news' ? 'News' : 'Event'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ <strong>Warning:</strong> This image will be permanently removed from the {imageToDelete.type === 'news' ? 'news' : 'event'}.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setImageToDelete(null)}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsProcessing(true);
                    
                    if (imageToDelete.type === 'news') {
                      // Delete from News
                      const updatedImages = [...(selectedNews.images || [])];
                      updatedImages.splice(imageToDelete.index, 1);
                      
                      const response = await api.put(`/api/news/${selectedNews._id}`, {
                        images: updatedImages
                      });
                      
                      if (response.data.success) {
                        setSuccessMessage('Image deleted successfully! 🗑️');
                        setShowSuccessModal(true);
                        setImageToDelete(null);
                        
                        // Refresh the news detail
                        const refreshResponse = await api.get(`/api/news/${selectedNews._id}`);
                        if (refreshResponse.data.success) {
                          setSelectedNews(refreshResponse.data.data);
                        }
                        
                        setTimeout(() => {
                          setShowSuccessModal(false);
                          setSuccessMessage('');
                        }, 3000);
                      }
                    } else if (imageToDelete.type === 'event') {
                      // Delete from Event - handle both eventImage array and images array
                      let updateData = {};
                      
                      if (imageToDelete.fieldType === 'eventImage') {
                        const updatedEventImages = Array.isArray(selectedEvent.eventImage) 
                          ? [...selectedEvent.eventImage] 
                          : [selectedEvent.eventImage];
                        updatedEventImages.splice(imageToDelete.index, 1);
                        updateData.eventImage = updatedEventImages;
                      } else {
                        const updatedImages = [...(selectedEvent.images || [])];
                        updatedImages.splice(imageToDelete.index, 1);
                        updateData.images = updatedImages;
                      }
                      
                      const response = await api.put(`/api/events/${selectedEvent._id}`, updateData);
                      
                      if (response.data.success) {
                        setSuccessMessage('Image deleted successfully! 🗑️');
                        setShowSuccessModal(true);
                        setImageToDelete(null);
                        
                        // Refresh the event detail
                        const refreshResponse = await api.get(`/api/events/${selectedEvent._id}`);
                        if (refreshResponse.data.success) {
                          setSelectedEvent(refreshResponse.data.data);
                        }
                        
                        setTimeout(() => {
                          setShowSuccessModal(false);
                          setSuccessMessage('');
                        }, 3000);
                      }
                    }
                  } catch (error) {
                    console.error('Error deleting image:', error);
                    alert(`Failed to delete image: ${error.response?.data?.message || error.message}`);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete News Confirmation Modal */}
      {showDeleteNewsModal && deletingNews && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Delete News?</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                <h4 className="font-bold text-lg text-gray-800 mb-2">{deletingNews.title}</h4>
                <p className="text-gray-600 mb-3">{deletingNews.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {deletingNews.category || 'General'}
                  </span>
                  <span>📅 {new Date(deletingNews.publishDate || deletingNews.createdAt).toLocaleDateString()}</span>
                </div>
                {deletingNews.tags && deletingNews.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {deletingNews.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ <strong>Warning:</strong> Deleting this news will permanently remove it from the database. 
                  All associated data including images and comments will be lost.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteNewsModal(false);
                  setDeletingNews(null);
                }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNews}
                disabled={isProcessing}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete News
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteEventModal && deletingEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Delete Event?</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                <h4 className="font-bold text-lg text-gray-800 mb-2">{deletingEvent.title}</h4>
                <p className="text-gray-600 mb-3">{deletingEvent.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Type:</span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      {deletingEvent.eventType || 'Event'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Date:</span>
                    <span className="text-gray-600">
                      {new Date(deletingEvent.date || deletingEvent.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Time:</span>
                    <span className="text-gray-600">
                      {deletingEvent.fromTime || deletingEvent.startTime} - {deletingEvent.toTime || deletingEvent.endTime}
                    </span>
                  </div>
                  {deletingEvent.venue && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Venue:</span>
                      <span className="text-gray-600">
                        {deletingEvent.venue.name || deletingEvent.venue}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ <strong>Warning:</strong> Deleting this event will permanently remove it from the database. 
                  All associated data including attendees, comments, and images will be lost.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setDeletingEvent(null);
                }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={isProcessing}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GogteKulAdmin;
