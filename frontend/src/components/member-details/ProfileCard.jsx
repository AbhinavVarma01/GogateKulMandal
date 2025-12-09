import React, { useMemo } from 'react';
import { User, Calendar, Heart, Briefcase, Mail, Phone, MapPin, Hash, Info, Layers } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

const buildAddress = (personal) => {
  return [
    personal?.flatPlotNumber,
    personal?.buildingNumber,
    personal?.colonyStreet,
    personal?.area,
    personal?.city,
    personal?.district,
    personal?.state,
    personal?.country,
    personal?.pinCode
  ]
    .filter(Boolean)
    .join(', ');
};

const ProfileCard = ({ member }) => {
  const personal = member?.personalDetails || {};
  const fullName = useMemo(() => {
    return [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(' ').trim();
  }, [personal.firstName, personal.middleName, personal.lastName]);

  const gender = (personal.gender || '').toLowerCase();
  const genderLabel = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Not specified';
  const genderChipClass = 'inline-flex items-center rounded-full bg-[#f9ede3] px-2 py-[2px] text-xs font-semibold text-[#b05a2b]';

  const dob = formatDate(personal.dateOfBirth);
  const status = personal.isAlive === 'yes' ? 'Living' : personal.isAlive === 'no' ? 'Passed Away' : '';
  const profession = personal.profession && personal.profession !== 'none' ? personal.profession : '';
  const email = personal.email || '';
  const mobileNumber = personal.mobileNumber || '';
  const level = member?.level !== undefined && member?.level !== null ? member.level : personal?.level || '';
  const address = buildAddress(personal);
  const about = personal.aboutYourself && personal.aboutYourself !== 'none' ? personal.aboutYourself : '';

  const infoRows = [
    dob ? { icon: Calendar, label: 'Date of Birth', value: dob } : null,
    status ? { icon: Heart, label: 'Status', value: status } : null,
    level !== undefined && level !== null ? { icon: Layers, label: 'Level', value: level } : null,
    profession ? { icon: Briefcase, label: 'Profession', value: profession } : null,
    email ? { icon: Mail, label: 'Email', value: email } : null,
    mobileNumber ? { icon: Phone, label: 'Mobile', value: mobileNumber } : null
  ].filter(Boolean);

  return (
    <div className="rounded-2xl border border-[#f0e0d4] bg-white/90 p-6 shadow-[0_1px_8px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow-md">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#f9ede3] to-white p-1">
          {personal?.profileImage?.data ? (
            <img
              src={`data:${personal.profileImage.mimeType};base64,${personal.profileImage.data}`}
              alt={fullName || 'Member avatar'}
              className="h-full w-full rounded-full object-contain"
            />
          ) : (
            <User className="h-8 w-8 text-[#d89a71]" />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#2b2b2b]">{fullName || 'Unnamed member'}</h1>
          <p className="text-sm font-medium text-[#a17c61]">Vansh {personal?.vansh || member?.vansh || '—'}</p>
          <div className="flex items-center justify-center gap-1 text-sm text-[#a17c61]">
            <Hash className="h-3.5 w-3.5 text-[#b05a2b]" />
            <span>Member ID {member?.sNo || member?.serNo || '—'}</span>
          </div>
        </div>
        <span className={genderChipClass}>{genderLabel}</span>
      </div>

      {infoRows.length > 0 && (
        <div className="mt-6 border-t border-[#f0e0d4] pt-4">
          <p className="text-sm font-semibold text-[#b05a2b]">Personal information</p>
          <div className="mt-3 space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 text-left">
                <row.icon className="mt-[2px] h-4 w-4 text-[#b05a2b]" />
                <div className="space-y-1">
                  <p className="text-xs text-[#a17c61]">{row.label}</p>
                  <p className="text-sm text-[#2b2b2b]">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {address && (
        <div className="mt-5 rounded-xl border border-[#f2d4be] bg-[#fff8f3] p-3 text-left">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#b05a2b]">
            <MapPin className="h-4 w-4 text-[#b05a2b]" />
            <span>Address</span>
          </div>
          <p className="text-sm leading-snug text-[#3f3f3f]">{address}</p>
        </div>
      )}

      {about && (
        <div className="mt-4 rounded-xl border border-[#f2d4be] bg-[#fff8f3] p-3 text-left">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#b05a2b]">
            <Info className="h-4 w-4 text-[#b05a2b]" />
            <span>About</span>
          </div>
          <p className="text-sm leading-snug text-[#3f3f3f]">{about}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
