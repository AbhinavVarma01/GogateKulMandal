import React from 'react';
import { UserIcon, MailIcon, PhoneIcon, CalendarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

const ProfileDropdown = ({ user, loading, error }) => {
  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black/10 p-4 z-50 border border-amber-100 flex items-center justify-center min-h-32">
        <span className="text-amber-700 animate-pulse">Loading...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black/10 p-4 z-50 border border-amber-100 flex items-center justify-center min-h-32">
        <span className="text-red-600">{error}</span>
      </div>
    );
  }
  if (!user || !(user.firstName || user.name)) return null;
  return (
    <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black/10 p-4 z-50 border border-amber-100 max-h-80 overflow-y-auto">
      <div className="flex items-center gap-3 mb-3">
        <UserIcon className="h-10 w-10 text-amber-700 bg-amber-100 rounded-full p-2" />
        <div>
          <div className="text-lg font-bold text-amber-800">{user.firstName || user.name} {user.lastName || ''}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        {user.phoneNumber && (
          <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-amber-400" /> {user.phoneNumber}</div>
        )}
        {user.phone && (
          <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-amber-400" /> {user.phone}</div>
        )}
        {user.dateOfBirth && (
          <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-amber-400" /> {user.dateOfBirth}</div>
        )}
        {user.gender && (
          <div className="flex items-center gap-2"><span className="font-medium">Gender:</span> {user.gender}</div>
        )}
        {user.occupation && (
          <div className="flex items-center gap-2"><BriefcaseIcon className="h-4 w-4 text-amber-400" /> {user.occupation}</div>
        )}
        {user.maritalStatus && (
          <div className="flex items-center gap-2"><span className="font-medium">Marital Status:</span> {user.maritalStatus}</div>
        )}
        {user.address && (
          <div className="flex flex-col gap-1">
            <span className="font-medium">Address:</span>
            {user.address.street && <span>{user.address.street}</span>}
            {user.address.city && <span>{user.address.city}</span>}
            {user.address.state && <span>{user.address.state}</span>}
            {user.address.pincode && <span>{user.address.pincode}</span>}
            {user.address.country && <span>{user.address.country}</span>}
          </div>
        )}
        {user.isAdmin !== undefined && (
          <div className="flex items-center gap-2"><span className="font-medium">Admin:</span> {user.isAdmin ? 'Yes' : 'No'}</div>
        )}
        {user.isActive !== undefined && (
          <div className="flex items-center gap-2"><span className="font-medium">Active:</span> {user.isActive ? 'Yes' : 'No'}</div>
        )}
        {user.familyId && (
          <div className="flex items-center gap-2"><span className="font-medium">Family ID:</span> {user.familyId}</div>
        )}
        {/* Add more fields as needed */}
      </div>
    </div>
  );
};

export default ProfileDropdown;
