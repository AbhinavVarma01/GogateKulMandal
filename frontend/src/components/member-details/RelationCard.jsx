import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mars, Venus, Hash, Layers } from 'lucide-react';

const buildName = (member) => {
  const personal = member?.personalDetails || {};
  return [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(' ').trim();
};

const RelationCard = ({ relation }) => {
  const related = relation?.member || {};
  const personal = related.personalDetails || {};
  const name = buildName(related) || related.fullName || 'Unnamed';
  const gender = (personal.gender || related.gender || '').toString().toLowerCase();
  const genderIcon = gender === 'female' ? <Venus className="h-3.5 w-3.5 text-[#b05a2b]" /> : <Mars className="h-3.5 w-3.5 text-[#b05a2b]" />;
  const memberId = related?.sNo || related?.serNo || '—';
  const level = related?.level !== undefined && related?.level !== null ? related.level : '';

  return (
    <Link
      to={`/family/member/${memberId}`}
      className="group flex min-h-[110px] flex-col gap-3 rounded-xl border border-[#f0e0d4] bg-white p-3 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-[#e97d43] hover:bg-[#fff7f2] hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#f9ede3] to-white shadow-inner p-1">
          {personal?.profileImage?.data ? (
            <img
              src={`data:${personal.profileImage.mimeType};base64,${personal.profileImage.data}`}
              alt={name}
              className="h-full w-full rounded-full object-contain"
            />
          ) : (
            <User className="h-5 w-5 text-[#d89a71]" />
          )}
        </div>
        <div className="space-y-1">
          <p className="truncate text-sm font-semibold text-[#2b2b2b]">{name}</p>
          <div className="text-xs font-medium text-[#b05a2b]">{relation?.relationEnglish}</div>
          {relation?.relationMarathi && (
            <div className="text-[11px] text-[#c07a4a]">{relation.relationMarathi}</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-1 text-gray-500">
          {genderIcon}
          <span>{gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '—'}</span>
        </div>
        <span className="truncate text-gray-500">Vansh {personal?.vansh || related?.vansh || '—'}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-[#b05a2b]" />
          <span>{memberId}</span>
        </div>
        {level !== '' && (
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-[#b05a2b]" />
            <span>{level}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default RelationCard;
