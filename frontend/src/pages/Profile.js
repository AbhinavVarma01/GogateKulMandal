import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase,
  Camera,
  Lock
} from 'lucide-react';

// Helper function to resolve profile image source (same as family tree)
const resolveProfileImageSrc = (input) => {
  if (!input) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) return trimmed;
    if (trimmed.startsWith('/') || trimmed.startsWith('./')) return trimmed;
    return `data:image/jpeg;base64,${trimmed}`;
  }
  if (typeof input === 'object') {
    if (typeof input.data === 'string' && input.data) {
      const mime = input.mimeType || input.type || 'image/jpeg';
      return `data:${mime};base64,${input.data}`;
    }
  }
  return null;
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    occupation: '',
    maritalStatus: 'Single',
    profilePicture: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const fileInputRef = useRef(null);

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      // Ensure nested address object exists
      if (!payload.address) payload.address = {};
      const res = await api.put('/api/users/profile', payload);
      setFormData(prev => ({ ...prev, ...res.data }));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err.response?.data || err.message);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save profile';
      alert(msg);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/auth/me');
      const data = res.data || {};
      setFormData({
        firstName: data.firstName || data.FirstName || data.firstname || '',
        middleName: data.middleName || data.MiddleName || data.middlename || '',
        lastName: data.lastName || data.LastName || data.lastname || '',
        email: data.email || '',
        phone: data.phoneNumber || data.phone || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
        occupation: data.occupation || '',
        maritalStatus: data.maritalStatus || 'Single',
        profilePicture: data.profilePicture || '',
        address: {
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || '',
          country: data.address?.country || 'India'
        }
      });
      setUserLoaded(true);
    } catch (err) {
      console.error('Failed to fetch profile:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMessage('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setPasswordMessage(msg);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      occupation: formData.occupation,
      maritalStatus: formData.maritalStatus || 'Single',
      profilePicture: formData.profilePicture,
      address: {
        street: formData.address?.street || '',
        city: formData.address?.city || '',
        state: formData.address?.state || '',
        pincode: formData.address?.pincode || '',
        country: formData.address?.country || 'India'
      }
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/95 to-orange-500/90" />
        <div className="relative p-6 sm:p-8 text-white rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-medium mb-2">
                <User size={14} className="mr-1" /> Account Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {`Welcome ${formData.firstName || 'User'}`}
              </h1>
              <p className="text-orange-50/90 text-sm sm:text-base mt-1">
                Manage your personal information and account settings
              </p>
            </div>
            <div className="flex flex-wrap gap-2" />
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-500">Update your account password securely.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="toggleShowPassword"
                type="checkbox"
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="toggleShowPassword" className="text-sm text-gray-700 select-none">
                Show passwords
              </label>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handlePasswordUpdate}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Update Password
              </button>
              <button
                onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
            {passwordMessage && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {passwordMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-orange-100">
                {resolveProfileImageSrc(formData?.profilePicture) ? (
                  <img
                    src={resolveProfileImageSrc(formData.profilePicture)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Convert to Base64 for quick preview and simple storage
                      const toBase64 = (f) => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(f);
                      });
                      try {
                        const base64 = await toBase64(file);
                        setFormData((prev) => ({ ...prev, profilePicture: base64 }));
                      } catch (err) {
                        console.error('Failed to read file', err);
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="absolute bottom-4 right-0 bg-orange-600 text-white p-2 rounded-full shadow hover:bg-orange-700 transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                </>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {formData.firstName} {formData.middleName && `${formData.middleName} `}{formData.lastName}
            </h2>
            <p className="text-gray-600">{formData.occupation || 'No occupation specified'}</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Mail size={16} />
              <span>{formData.email}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">Marital: {formData.maritalStatus || '—'}</div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">Country: {formData.address?.country || '—'}</div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            {!isEditing && (
              <span className="text-xs text-gray-500">Last updated just now</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <User size={16} className="text-gray-400" />
                  <span>{formData.firstName || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <User size={16} className="text-gray-400" />
                  <span>{formData.middleName || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <User size={16} className="text-gray-400" />
                  <span>{formData.lastName || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <Mail size={16} className="text-gray-400" />
                  <span>{formData.email || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <Phone size={16} className="text-gray-400" />
                  <span>{formData.phone || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <Calendar size={16} className="text-gray-400" />
                  <span>
                    {formData.dateOfBirth 
                      ? new Date(formData.dateOfBirth).toLocaleDateString() 
                      : 'Not specified'
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <Briefcase size={16} className="text-gray-400" />
                  <span>{formData.occupation || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Marital Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marital Status
              </label>
              {isEditing ? (
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <User size={16} className="text-gray-400" />
                  <span>{formData.maritalStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="mt-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin size={20} className="mr-2" />
              Address
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <span className="text-gray-900">{formData.address.street || 'Not specified'}</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <span className="text-gray-900">{formData.address.city || 'Not specified'}</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <span className="text-gray-900">{formData.address.state || 'Not specified'}</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <span className="text-gray-900">{formData.address.pincode || 'Not specified'}</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <span className="text-gray-900">{formData.address.country}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
