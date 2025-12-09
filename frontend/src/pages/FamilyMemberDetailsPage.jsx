import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import MemberDetails from '../components/member-details/MemberDetails';
import DescendantTree from '../components/member-details/DescendantTree';

const getMemberName = (person) => {
  if (!person) return 'Member';
  const personal = person.personalDetails || {};
  const parts = [personal.firstName || person.firstName, personal.middleName || person.middleName, personal.lastName || person.lastName]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Member';
};

const FamilyMemberDetailsPage = ({ descendantsOnly = false }) => {
  const { serNo } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [effectiveVansh, setEffectiveVansh] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Determine effective vansh (admin/dba/master_admin/users)
        let vanshParam = '';
        try {
          const meResponse = await api.get('/api/auth/me');
          const role = meResponse.data?.role || 'user';
          const managedVansh = meResponse.data?.managedVansh;
          const userVansh = meResponse.data?.VanshNo ?? meResponse.data?.vansh ?? '';
          const normalizedManaged = managedVansh === undefined || managedVansh === null ? '' : `${managedVansh}`.trim();
          const normalizedUserVansh = userVansh === undefined || userVansh === null ? '' : `${userVansh}`.trim();
          const isMasterAdmin = role === 'master_admin';
          const isDBA = role === 'dba';
          const isAdmin = role === 'admin' || isMasterAdmin;
          vanshParam = isMasterAdmin || isDBA ? '' : (isAdmin ? normalizedManaged : normalizedUserVansh);
          setEffectiveVansh(vanshParam);
        } catch (meErr) {
          // If we cannot resolve user info, proceed without vansh param
          console.warn('Unable to resolve user vansh for member details:', meErr);
        }

        const params = vanshParam ? { params: { vansh: vanshParam } } : {};

        const [memberResponse, membersResponse] = await Promise.all([
          api.get(`/api/family/members/by-serno/${serNo}`, params),
          api.get('/api/family/members', params)
        ]);

        const currentMember = memberResponse.data?.member || null;
        const membersList = membersResponse.data?.members || membersResponse.data || [];

        setMember(currentMember);
        setAllMembers(Array.isArray(membersList) ? membersList : []);
        setError('');
      } catch (err) {
        const message = err?.response?.data?.message || 'Failed to load member details. Please try again.';
        setError(message);
        setMember(null);
        setAllMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (serNo) {
      fetchData();
    }
  }, [serNo]);

  const targetSerNo = member?.sNo ?? member?.serNo ?? serNo;

  const handleBack = () => {
    navigate('/kulavruksh');
  };

  const handleViewDescendants = () => {
    if (!targetSerNo) return;
    navigate(`/family/member/${targetSerNo}/descendants`);
  };

  const handleBackToDetails = () => {
    if (!targetSerNo) return;
    navigate(`/family/member/${targetSerNo}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f2]">
        <div className="flex flex-col items-center gap-4 text-orange-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-medium">Loading member details…</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f2] px-4">
        <div className="max-w-md w-full rounded-2xl border border-orange-100 bg-white/90 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="mb-6 text-sm font-medium text-gray-700">{error || 'Member not found.'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (descendantsOnly) {
    return (
      <div
        className="min-h-screen flex flex-col bg-white"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{getMemberName(member)}</h1>
              <p className="text-sm text-slate-500">Descendant Tree View</p>
            </div>
            <button
              onClick={handleBackToDetails}
              className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-[#ea580c]"
            >
              Back to Member Details
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100">
          <div className="h-full px-6 py-10">
            <DescendantTree
              member={member}
              allMembers={allMembers}
              variant="kulavruksh"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <MemberDetails
      member={member}
      allMembers={allMembers}
      onBack={handleBack}
      onViewDescendants={handleViewDescendants}
    />
  );
};

export default FamilyMemberDetailsPage;
