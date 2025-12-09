import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, RefreshCw, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AddEditMemberModal } from './AddEditMemberModal';
import { ConfirmDeleteModal } from './confirmDeleteModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || window.location.origin;

export function FamilyTreeTable({ onMemberClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/dba/family-members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch family members');
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchMembers(true);
  };

  const filteredMembers = members.filter(member => {
    const name = member.name || (member.firstName + ' ' + member.lastName) || '';
    const relationship = member.relationship || '';
    const searchLower = searchTerm.toLowerCase();
    
    return name.toLowerCase().includes(searchLower) ||
           relationship.toLowerCase().includes(searchLower);
  });

  const handleAddMember = async (memberData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/dba/family-members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        throw new Error('Failed to create family member');
      }

      const data = await response.json();
      setMembers([...members, data.member]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating member:', err);
      setError(err.message);
    }
  };

  const handleEditMember = async (memberData) => {
    if (editingMember) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/dba/family-members/${editingMember._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(memberData)
        });

        if (!response.ok) {
          throw new Error('Failed to update family member');
        }

        // Refresh the members list
        await fetchMembers();
        setEditingMember(null);
      } catch (err) {
        console.error('Error updating member:', err);
        setError(err.message);
      }
    }
  };

  const handleDeleteMember = async () => {
    if (deletingMember) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/dba/family-members/${deletingMember._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete family member');
        }

        // Refresh the members list
        await fetchMembers();
        setDeletingMember(null);
      } catch (err) {
        console.error('Error deleting member:', err);
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-8">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-[#c4601e]">Loading family members...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Family Members</h2>
              <p className="text-sm text-gray-600">Click on names to view relationships</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search family members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-700 font-semibold">Name</th>
              <th className="px-6 py-4 text-left text-gray-700 font-semibold">Relationship</th>
              <th className="px-6 py-4 text-left text-gray-700 font-semibold">Birth Date</th>
              <th className="px-6 py-4 text-left text-gray-700 font-semibold">Location</th>
              <th className="px-6 py-4 text-left text-gray-700 font-semibold">Status</th>
              <th className="px-6 py-4 text-center text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No family members found
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const fullName = member.name || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.lastName || 'Unknown');
                const relationship = member.relationship || member.relation || 'Not specified';
                const birthDate = member.birthDate || member.dateOfBirth || member.dob || 'Not specified';
                const location = member.location || member.address || member.place || 'Not specified';
                const status = member.status || member.livingStatus || 'Unknown';
                
                return (
                  <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onMemberClick && onMemberClick(member._id)}
                        className="text-[#c4601e] font-medium hover:text-orange-600 hover:underline transition-colors cursor-pointer"
                      >
                        {fullName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{relationship}</td>
                    <td className="px-6 py-4 text-gray-600">{birthDate}</td>
                    <td className="px-6 py-4 text-gray-600">{location}</td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={status === 'living' || status === 'alive' ? 'default' : 'secondary'}
                        className={status === 'living' || status === 'alive'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                          : status === 'deceased' || status === 'dead'
                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => setEditingMember(member)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          size="sm"
                          title="Edit member details"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeletingMember(member)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          size="sm"
                          title="Delete member"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddEditMemberModal
        isOpen={isAddModalOpen || !!editingMember}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMember(null);
        }}
        onSave={editingMember ? handleEditMember : handleAddMember}
        member={editingMember}
        title={editingMember ? 'Edit Family Member' : 'Add Family Member'}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteMember}
        memberName={deletingMember?.name || (deletingMember?.firstName && deletingMember?.lastName ? `${deletingMember.firstName} ${deletingMember.lastName}` : 'this member') || 'this member'}
      />
    </div>
  );
}
