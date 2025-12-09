import { useState, useEffect } from 'react';
import { RefreshCw, Users, Eye, TrendingUp, Database, Shield, X, User, Heart, Users2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FamilyTreeTable } from './familytreeTable';

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || window.location.origin;

export function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    livingMembers: 0,
    deceasedMembers: 0,
    recentAdditions: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [showRelationships, setShowRelationships] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/dba/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats!');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleMemberClick = async (memberId) => {
    try {
      console.log('Fetching relationships for member ID:', memberId);
      console.log('API Base URL:', API_BASE_URL);
      const token = localStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      
      // First test if server is running
      try {
        const testResponse = await fetch(`${API_BASE_URL}/api/test`);
        const testData = await testResponse.json();
        console.log('Server test response:', testData);
      } catch (testErr) {
        console.error('Server test failed:', testErr);
        throw new Error('Server is not running or not accessible');
      }
      
      const url = `${API_BASE_URL}/api/dba/member-relationships/${memberId}`;
      console.log('Full URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      console.log('Content type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch relationships`);
      }

      const data = await response.json();
      console.log('Received relationship data:', data);
      setSelectedMember(data.member);
      setRelationships(data.relationships);
      setShowRelationships(true);
    } catch (err) {
      console.error('Error fetching relationships:', err);
      setError(`Failed to fetch relationships: ${err.message}`);
    }
  };

  const closeRelationships = () => {
    setShowRelationships(false);
    setSelectedMember(null);
    setRelationships([]);
    setError(null); // Clear any previous errors
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-lg text-orange-600 font-medium">Loading DBA Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Error</span>
          </div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Database className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Database Administrator</h1>
                <p className="text-gray-600">Family Tree Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Last updated</div>
                <div className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalMembers}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Living Members</p>
                <p className="text-3xl font-bold text-green-600">{stats.livingMembers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deceased Members</p>
                <p className="text-3xl font-bold text-gray-600">{stats.deceasedMembers}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users2 className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Additions</p>
                <p className="text-3xl font-bold text-blue-600">{stats.recentAdditions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Restricted Access Area</h3>
              <p className="text-sm text-red-700">All administrative actions are logged and monitored for security purposes.</p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-lg border border-orange-100">
          <FamilyTreeTable onMemberClick={handleMemberClick} />
        </div>
      </div>

      {/* Relationships Modal */}
      {showRelationships && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Relationships for {selectedMember.name}</h2>
                  <p className="text-sm text-gray-600">Status: {selectedMember.status}</p>
                </div>
              </div>
              <Button
                onClick={closeRelationships}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {error ? (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Error</span>
                    </div>
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button
                      onClick={closeRelationships}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : relationships.length === 0 ? (
                <div className="text-center py-8">
                  <Users2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No relationships found for this member.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationships.map((rel, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{rel.member.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rel.member.status === 'living' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rel.member.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">English:</span> {rel.relationEnglish}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Marathi:</span> {rel.relationMarathi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
