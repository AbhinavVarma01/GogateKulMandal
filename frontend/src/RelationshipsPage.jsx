import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  Search, 
  Filter, 
  ArrowRight,
  BarChart3,
  Network,
  Eye,
  Home
} from 'lucide-react';
import api from '../utils/api';

const RelationshipsPage = () => {
  const [relationships, setRelationships] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('');
  const [selectedFromMember, setSelectedFromMember] = useState('');
  const [selectedToMember, setSelectedToMember] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [relationshipsRes, membersRes] = await Promise.all([
          api.get('/api/family/all-relationships'),
          api.get('/api/family/members-new')
        ]);
        
        setRelationships(relationshipsRes.data);
        setMembers(membersRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching relationships:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get member name by serNo
  const getMemberName = (serNo) => {
    const member = members.find(m => m.serNo === serNo);
    return member ? member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() : `Member #${serNo}`;
  };

  // Get unique relationship types
  const relationshipTypes = [...new Set(relationships.map(r => r.relation))].sort();

  // Filter relationships
  const filteredRelationships = relationships.filter(rel => {
    const fromMemberName = getMemberName(rel.fromSerNo);
    const toMemberName = getMemberName(rel.toSerNo);
    
    const matchesSearch = !searchTerm || 
      rel.relation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.relationMarathi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromMemberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toMemberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.fromSerNo.toString().includes(searchTerm) ||
      rel.toSerNo.toString().includes(searchTerm);
    
    const matchesRelationType = !selectedRelationType || rel.relation === selectedRelationType;
    const matchesFromMember = !selectedFromMember || rel.fromSerNo.toString() === selectedFromMember;
    const matchesToMember = !selectedToMember || rel.toSerNo.toString() === selectedToMember;
    
    return matchesSearch && matchesRelationType && matchesFromMember && matchesToMember;
  });

  // Calculate statistics
  const stats = {
    totalRelationships: relationships.length,
    uniqueRelationTypes: relationshipTypes.length,
    filteredCount: filteredRelationships.length,
    relationshipCounts: relationshipTypes.reduce((acc, type) => {
      acc[type] = relationships.filter(r => r.relation === type).length;
      return acc;
    }, {}),
    memberConnections: members.reduce((acc, member) => {
      const connections = relationships.filter(r => r.fromSerNo === member.serNo || r.toSerNo === member.serNo);
      acc[member.serNo] = connections.length;
      return acc;
    }, {})
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading relationships data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Family Relationships</h1>
            <p className="text-gray-600 mt-1">
              Explore all {relationships.length} documented family relationships across {relationshipTypes.length} different types
            </p>
          </div>
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <Link 
              to="/family"
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <Home className="mr-2" size={16} />
              Family List
            </Link>
            <Link 
              to="/family/tree/1"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <Network className="mr-2" size={16} />
              Family Tree
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Relationships</p>
                <p className="text-2xl font-bold text-purple-800">{stats.totalRelationships}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-blue-600 text-sm font-medium">Relation Types</p>
                <p className="text-2xl font-bold text-blue-800">{stats.uniqueRelationTypes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-green-600 text-sm font-medium">Filtered Results</p>
                <p className="text-2xl font-bold text-green-800">{stats.filteredCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-orange-600 text-sm font-medium">Connected Members</p>
                <p className="text-2xl font-bold text-orange-800">{members.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Relationships</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search relationships..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Relationship Type Filter */}
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRelationType}
            onChange={(e) => setSelectedRelationType(e.target.value)}
          >
            <option value="">All Relationship Types</option>
            {relationshipTypes.map(type => (
              <option key={type} value={type}>
                {type} ({stats.relationshipCounts[type]})
              </option>
            ))}
          </select>

          {/* From Member Filter */}
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedFromMember}
            onChange={(e) => setSelectedFromMember(e.target.value)}
          >
            <option value="">All From Members</option>
            {members.map(member => (
              <option key={member.serNo} value={member.serNo}>
                #{member.serNo} {getMemberName(member.serNo)}
              </option>
            ))}
          </select>

          {/* To Member Filter */}
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedToMember}
            onChange={(e) => setSelectedToMember(e.target.value)}
          >
            <option value="">All To Members</option>
            {members.map(member => (
              <option key={member.serNo} value={member.serNo}>
                #{member.serNo} {getMemberName(member.serNo)}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedRelationType || selectedFromMember || selectedToMember) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
              </span>
            )}
            {selectedRelationType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Type: {selectedRelationType}
                <button onClick={() => setSelectedRelationType('')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
              </span>
            )}
            {selectedFromMember && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                From: #{selectedFromMember}
                <button onClick={() => setSelectedFromMember('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
              </span>
            )}
            {selectedToMember && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                To: #{selectedToMember}
                <button onClick={() => setSelectedToMember('')} className="ml-1 text-orange-600 hover:text-orange-800">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Relationships Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Relationships ({filteredRelationships.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relationship
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marathi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRelationships.map((rel, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        #{rel.fromSerNo}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        {getMemberName(rel.fromSerNo)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {rel.relation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        #{rel.toSerNo}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        {getMemberName(rel.toSerNo)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rel.relationMarathi || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/family/member/${rel.fromSerNo}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View From Member"
                      >
                        <Eye size={16} />
                      </Link>
                      <ArrowRight size={16} className="text-gray-400" />
                      <Link 
                        to={`/family/member/${rel.toSerNo}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View To Member"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relationship Types Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Relationship Types Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {relationshipTypes.map(type => (
            <div 
              key={type}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRelationType === type 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
              onClick={() => setSelectedRelationType(selectedRelationType === type ? '' : type)}
            >
              <div className="text-sm font-medium text-gray-900">{type}</div>
              <div className="text-xs text-gray-500">
                {stats.relationshipCounts[type]} relationships
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelationshipsPage;