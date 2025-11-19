import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import ApiDebugger from '../components/debug/ApiDebugger';

const RelationshipTestPage = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/api/family/members-new');
        setMembers(response.data);
        console.log('Fetched members:', response.data.length);
      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };
    fetchMembers();
  }, []);

  const fetchRelations = async (serNo) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching relations for serNo: ${serNo}`);
      
      const response = await api.get(`/api/family/dynamic-relations/${serNo}`);
      console.log('Relations response:', response.data);
      
      setRelations(response.data || []);
      setSelectedMember(members.find(m => m.serNo === serNo));
    } catch (err) {
      console.error('Error fetching relations:', err);
      setError(err.response?.data?.message || err.message);
      setRelations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* API Debugger */}
          <ApiDebugger />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Relationship Test Page</h1>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Members List */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Family Members</h2>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {members.map(member => (
                  <button
                    key={member.serNo}
                    onClick={() => fetchRelations(member.serNo)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMember?.serNo === member.serNo
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{member.fullName}</p>
                        <p className="text-sm text-gray-600">#{member.serNo} • Level {member.level}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.gender}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Relations Display */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Relations {selectedMember && `for ${selectedMember.fullName}`}
              </h2>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span>Loading relations...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {!loading && !error && selectedMember && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900">Selected Member</h3>
                    <p className="text-blue-800">{selectedMember.fullName} (#{selectedMember.serNo})</p>
                    <p className="text-sm text-blue-600">Level {selectedMember.level} • {selectedMember.gender}</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Relations Found: {relations.length}
                    </h3>
                    
                    {relations.length === 0 ? (
                      <p className="text-gray-600">No relations found</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {relations.map((relation, idx) => {
                          const name = [
                            relation.related?.firstName,
                            relation.related?.middleName,
                            relation.related?.lastName
                          ].filter(Boolean).join(' ');
                          
                          return (
                            <div key={idx} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">
                                    {relation.relationEnglish}
                                    {relation.relationMarathi && (
                                      <span className="text-purple-600 ml-1">
                                        [{relation.relationMarathi}]
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-gray-700">{name}</p>
                                  <p className="text-xs text-gray-500">
                                    SerNo: {relation.related?.serNo}
                                  </p>
                                </div>
                                <button
                                  onClick={() => fetchRelations(relation.related?.serNo)}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  View Relations
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedMember && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Click on a family member to see their relations</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipTestPage;