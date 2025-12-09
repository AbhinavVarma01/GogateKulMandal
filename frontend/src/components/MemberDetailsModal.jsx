import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, User, Calendar, MapPin, Briefcase, GraduationCap, Phone, Mail, Users, Heart } from 'lucide-react';
import api from '../utils/api';

export function MemberDetailsModal({ isOpen, onClose, member }) {
  const [familyMembers, setFamilyMembers] = useState({});
  
  const formatName = (person) => {
    const parts = [person.firstName, person.middleName, person.lastName].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  };

  // Fetch family member names
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!member) return;
      
      const memberIds = [
        member.fatherSerNo,
        member.motherSerNo,
        member.spouseSerNo,
        ...(member.childrenSerNos || [])
      ].filter(Boolean);

      const members = {};
      
      for (const serNo of memberIds) {
        try {
          const response = await api.get(`/api/family/members/by-serno/${serNo}`);
          const data = response.data;
          if (data.member) {
            members[serNo] = formatName(data.member);
          }
        } catch (error) {
          console.error(`Error fetching member ${serNo}:`, error);
        }
      }
      
      setFamilyMembers(members);
    };

    if (isOpen && member) {
      fetchFamilyMembers();
    }
  }, [isOpen, member]);

  if (!member) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dob, dod) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const endDate = dod ? new Date(dod) : new Date();
      const age = Math.floor((endDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  };

  // Get parent names by finding them in the member list
  const getParentName = async (serNo) => {
    if (!serNo) return null;
    try {
      const response = await api.get(`/api/family/members/by-serno/${serNo}`);
      return formatName(response.data.member);
    } catch (error) {
      console.error('Error fetching parent:', error);
    }
    return `SerNo ${serNo}`;
  };

  const age = calculateAge(member.dob, member.dod);
  const isDeceased = member.dod;
  const isFemale = member.gender === 'Female' || member.gender === 'female';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] h-[700px] max-w-none max-h-none overflow-hidden flex flex-col bg-white shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-2 pb-4 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className={`flex items-center gap-3 text-2xl font-semibold ${isFemale ? 'text-pink-800' : 'text-blue-800'}`}>
            <div className={`p-3 rounded-full ${isFemale ? 'bg-pink-100 border border-pink-200' : 'bg-blue-100 border border-blue-200'}`}>
              <User className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span>{formatName(member)}</span>
              {isDeceased && <span className="text-sm text-gray-500 font-normal">Deceased</span>}
            </div>
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-9 w-9 p-0 hover:bg-red-50 border border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-6 px-1">
            {/* Profile Image Section */}
            {member.profileImage && (
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={member.profileImage} 
                    alt={formatName(member)}
                    className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-gray-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${isFemale ? 'bg-pink-500' : 'bg-blue-500'} flex items-center justify-center`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-xl mb-4 text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Serial Number</label>
                  <p className="font-bold text-lg text-gray-900 mt-1">#{member.serNo}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
                  <p className={`font-semibold text-lg mt-1 ${isFemale ? 'text-pink-600' : 'text-blue-600'}`}>
                    {member.gender || 'Not specified'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</label>
                  <p className="font-semibold text-lg text-gray-900 mt-1">{member.level !== undefined ? `Level ${member.level}` : 'Not specified'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                  <p className="font-medium text-gray-900 mt-1">{member.firstName || 'Not specified'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Middle Name</label>
                  <p className="font-medium text-gray-900 mt-1">{member.middleName || 'Not specified'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                  <p className="font-medium text-gray-900 mt-1">{member.lastName || 'Not specified'}</p>
                </div>
                {member.vansh && (
                  <div className="col-span-full bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Vansh/Lineage Code</label>
                    <p className="text-orange-800 font-semibold text-lg mt-1">{member.vansh}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Biography Section */}
            {member.Bio && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
                <h3 className="font-semibold text-xl mb-4 text-amber-800 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <span className="text-xl">📖</span>
                  </div>
                  Biography
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-gray-700 leading-relaxed text-base">{member.Bio}</p>
                </div>
              </div>
            )}

            {/* Life Dates */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-xl mb-4 text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                Life Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</label>
                  <p className={`font-semibold text-lg mt-1 ${member.dob ? 'text-green-600' : 'text-gray-400'}`}>
                    {member.dob ? formatDate(member.dob) : 'Not specified'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Death</label>
                  <p className={`font-semibold text-lg mt-1 ${member.dod ? 'text-red-600' : 'text-gray-400'}`}>
                    {member.dod ? formatDate(member.dod) : (isDeceased ? 'Not specified' : 'Living')}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {(member.birthPlace || member.address) && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="font-semibold text-xl mb-4 text-green-800 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Birthplace</label>
                    <p className="text-green-700 font-medium text-base mt-1">{member.birthPlace || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                    <p className="text-green-700 font-medium text-base mt-1">{member.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Information */}
            {(member.occupation || member.education) && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <h3 className="font-semibold text-xl mb-4 text-amber-800 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  </div>
                  Professional Life
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Occupation</label>
                    <p className="text-amber-700 font-medium text-base mt-1 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {member.occupation || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Education</label>
                    <p className="text-amber-700 font-medium text-base mt-1 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      {member.education || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {(member.phone || member.email) && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                <h3 className="font-semibold text-xl mb-4 text-indigo-800 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-indigo-700 font-medium text-base mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {member.phone || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-indigo-700 font-medium text-base mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {member.email || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Family Relationships */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
              <h3 className="font-semibold text-xl mb-4 text-purple-800 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                Family Relationships
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parents */}
                <div className="col-span-full">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Parents</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
                      <label className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Father</label>
                      <p className={`font-medium text-base mt-1 ${member.fatherSerNo ? 'text-blue-700' : 'text-gray-400'}`}>
                        {member.fatherSerNo ? (familyMembers[member.fatherSerNo] || `SerNo ${member.fatherSerNo}`) : 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-pink-400">
                      <label className="text-xs font-semibold text-pink-600 uppercase tracking-wide">Mother</label>
                      <p className={`font-medium text-base mt-1 ${member.motherSerNo ? 'text-pink-700' : 'text-gray-400'}`}>
                        {member.motherSerNo ? (familyMembers[member.motherSerNo] || `SerNo ${member.motherSerNo}`) : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Spouse */}
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-400">
                  <label className="text-xs font-semibold text-red-600 uppercase tracking-wide">Spouse</label>
                  <p className={`font-medium text-base mt-1 flex items-center gap-2 ${member.spouseSerNo ? 'text-red-700' : 'text-gray-400'}`}>
                    <Heart className="w-4 h-4" />
                    {member.spouseSerNo ? (familyMembers[member.spouseSerNo] || `SerNo ${member.spouseSerNo}`) : 'Not specified'}
                  </p>
                </div>

                {/* Children */}
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide">Children</label>
                  {member.childrenSerNos && member.childrenSerNos.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {member.childrenSerNos.map((childSerNo, index) => (
                        <span 
                          key={index}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200 shadow-sm"
                          title={`SerNo: ${childSerNo}`}
                        >
                          {familyMembers[childSerNo] || `SerNo ${childSerNo}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 font-medium mt-1">No children recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="text-sm text-gray-500">
            Member ID: #{member.serNo} • {formatName(member)}
          </div>
          <Button 
            onClick={onClose} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
