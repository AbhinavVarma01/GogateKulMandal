import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Crosshair, ZoomIn, ZoomOut, RotateCcw, Eye, Navigation, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 230;
const COUPLE_GAP = 36;
const HORIZONTAL_UNIT = 460;
const VERTICAL_UNIT = 260;
const CANVAS_PADDING_X = 140;
const CANVAS_PADDING_TOP = 120;
const CANVAS_PADDING_BOTTOM = 200;
const CONNECTOR_GAP = 28;

const profileImageKeys = [
  'profileImage',
  'profile_image',
  'profileImageUrl',
  'profile_image_url',
  'profilePhoto',
  'profile_photo',
  'profilePhotoUrl',
  'profilePic',
  'profilepic',
  'image',
  'photo',
  'photoUrl',
  'avatar',
  'picture'
];

const selectProfileImageSource = entity => {
  if (!entity || typeof entity !== 'object') return null;
  for (const key of profileImageKeys) {
    const value = entity[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  if (entity.personalDetails && typeof entity.personalDetails === 'object') {
    const nested = selectProfileImageSource(entity.personalDetails);
    if (nested) return nested;
  }
  if (entity.marriedDetails && typeof entity.marriedDetails === 'object') {
    const nested = selectProfileImageSource(entity.marriedDetails);
    if (nested) return nested;
  }
  return null;
};

const resolveProfileImageSrc = input => {
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
    if (typeof input.base64 === 'string' && input.base64) {
      const mime = input.mimeType || input.type || 'image/jpeg';
      return `data:${mime};base64,${input.base64}`;
    }
    if (Array.isArray(input) && input.length > 0) {
      const merged = input.join('');
      if (merged) {
        return `data:image/jpeg;base64,${merged}`;
      }
    }
  }
  return null;
};

const Kulavruksh = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [vanshList, setVanshList] = useState([]);
  const [selectedVansh, setSelectedVansh] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [currentUserVansh, setCurrentUserVansh] = useState('');
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ x: 0, y: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const meResponse = await api.get('/api/auth/me');
      const userRole = meResponse.data?.role || 'user';
      const rawManagedVansh = meResponse.data?.managedVansh;
      const rawUserVansh = meResponse.data?.VanshNo ?? meResponse.data?.vansh ?? '';
      const managedVansh = rawManagedVansh === undefined || rawManagedVansh === null ? '' : `${rawManagedVansh}`.trim();
      const userVansh = rawUserVansh === undefined || rawUserVansh === null ? '' : `${rawUserVansh}`.trim();
      const isMasterAdmin = userRole === 'master_admin';
      const isAdmin = userRole === 'admin' || isMasterAdmin;
      const isDBA = userRole === 'dba';
      const effectiveVansh = isMasterAdmin ? '' : (isAdmin ? managedVansh : (isDBA ? '' : userVansh));
      
      setUserRole(userRole);
      setCurrentUserVansh(effectiveVansh);
      
      if (userRole === 'admin' && !managedVansh) {
        setError('Your admin account does not have vansh assignment.');
        setMembers([]);
        setVanshList([]);
        setSelectedVansh('');
        return;
      }
      
      if (!isAdmin && !isDBA && !userVansh) {
        setError('Your account does not have vansh information.');
        setMembers([]);
        setVanshList([]);
        setSelectedVansh('');
        return;
      }
      
      const params = {};
      if (effectiveVansh) {
        params.vansh = effectiveVansh;
      }
      const membersResponse = await api.get('/api/family/members', { params });
      const allMembers = membersResponse.data?.members || membersResponse.data || [];
      const cleanedMembers = deduplicateMembers(allMembers);
      
      let filteredMembers = cleanedMembers;
      if (effectiveVansh) {
        filteredMembers = cleanedMembers.filter(member => {
          const personal = member.personalDetails || {};
          const value = personal.vansh ?? member.vansh;
          if (value === undefined || value === null) return false;
          return `${value}`.trim() === effectiveVansh;
        });
      }
      
      if (filteredMembers.length === 0) {
        const vanshInfo = effectiveVansh ? `for Vansh ${effectiveVansh}` : 'in the system';
        setError(`No family members found ${vanshInfo}.`);
        setMembers([]);
        setVanshList([]);
        setSelectedVansh('');
        return;
      }
      
      const uniqueVansh = new Set();
      filteredMembers.forEach(member => {
        const personal = member.personalDetails || {};
        const value = personal.vansh ?? member.vansh;
        if (value !== undefined && value !== null) {
          const stringValue = `${value}`.trim();
          if (stringValue) {
            uniqueVansh.add(stringValue);
          }
        }
      });
      const sortedVansh = Array.from(uniqueVansh).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );
      setMembers(filteredMembers);
      setVanshList(sortedVansh);
      
      const selectedVanshValue = effectiveVansh
        ? (sortedVansh.includes(effectiveVansh) ? effectiveVansh : sortedVansh[0] || '')
        : (sortedVansh[0] || '');
      setSelectedVansh(selectedVanshValue);
    } catch (err) {
      setError('Unable to load family tree.');
      setMembers([]);
      setVanshList([]);
      setSelectedVansh('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const scrollByOffset = useCallback((deltaX, deltaY = 0) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollBy({ left: deltaX, top: deltaY, behavior: 'smooth' });
  }, []);

  const scrollToCenter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const targetLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
    container.scrollTo({ left: targetLeft, top: 0, behavior: 'smooth' });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap';
    document.head.appendChild(fontLink);
    const styleEl = document.createElement('style');
    styleEl.textContent = "@keyframes gfFadeIn {from {opacity: 0; transform: translateY(16px);} to {opacity: 1; transform: translateY(0);}}";
    document.head.appendChild(styleEl);
    return () => {
      if (fontLink.parentNode) fontLink.parentNode.removeChild(fontLink);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateWidth = () => {
      setContainerWidth(element.getBoundingClientRect().width);
    };
    updateWidth();
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateWidth());
      observer.observe(element);
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.cursor = 'grab';
    let active = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let hasDragged = false;
    const DRAG_THRESHOLD = 5; // Pixels required to count as drag
    const handlePointerDown = event => {
      // Don't capture pointer if clicking on a card or button
      if (event.target.closest('.rounded-2xl') || event.target.closest('button')) {
        return;
      }
      active = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      hasDragged = false;
      container.setPointerCapture(event.pointerId);
      container.style.cursor = 'grabbing';
    };
    const handlePointerMove = event => {
      if (!active || event.pointerId !== pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > DRAG_THRESHOLD) {
        hasDragged = true;
        container.scrollLeft = scrollLeft - deltaX;
        container.scrollTop = scrollTop - deltaY;
      }
    };
    const handlePointerUp = event => {
      if (event.pointerId !== pointerId) return;
      active = false;
      container.releasePointerCapture(event.pointerId);
      container.style.cursor = 'grab';
    };
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.style.cursor = '';
    };
  }, []);

  const treeData = useMemo(() => {
    if (!selectedVansh) return null;
    const filtered = members.filter(member => {
      const personal = member.personalDetails || {};
      const value = personal.vansh ?? member.vansh;
      if (value === undefined || value === null) return false;
      return `${value}` === selectedVansh;
    });
    if (filtered.length === 0) return null;
    const deduped = deduplicateMembers(filtered);
    const sorted = deduped.slice().sort((a, b) => {
      const aSer = normalizeNumber(a.serNo);
      const bSer = normalizeNumber(b.serNo);
      if (aSer === null && bSer === null) {
        return composeNameKey(a).localeCompare(composeNameKey(b));
      }
      if (aSer === null) return 1;
      if (bSer === null) return -1;
      return aSer - bSer;
    });
    const tree = buildFamilyTree(sorted);
    // DEBUG: Check if Ballal and Ramkrishna are in sorted array
    const hasBallal = sorted.some(m => normalizeNumber(m.serNo) === 28);
    const hasRamkrishna = sorted.some(m => normalizeNumber(m.serNo) === 1);
    console.log('DEBUG buildFamilyTree:', {
      totalMembers: sorted.length,
      hasBallal,
      hasRamkrishna,
      serNos: sorted.map(m => normalizeNumber(m.serNo))
    });
    const layoutNodes = tree.map(convertTreeNodeToLayout);
    if (layoutNodes.length === 0) return null;
    if (layoutNodes.length === 1) return layoutNodes[0];
    return layoutNodes;
  }, [members, selectedVansh]);

  const layout = useMemo(() => buildLayout(treeData), [treeData]);

  useEffect(() => {
    if (!layout.nodes.length) return;
    scrollToCenter();
  }, [layout.nodes.length, scrollToCenter]);

  const handleVanshChange = value => {
    setSelectedVansh(value);
  };

  const getInitials = person => {
    if (!person) return 'U';
    const name = person.name || person.fullName || person.memberName || person.displayName || '';
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const formatGender = gender => {
    const value = (gender || '').toString().trim().toLowerCase();
    if (value === 'male') return 'Male';
    if (value === 'female') return 'Female';
    if (!value) return 'Unknown';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const badgeColor = gender => {
    const value = (gender || '').toString().trim().toLowerCase();
    if (value === 'male') return '#2563eb';
    if (value === 'female') return '#db2777';
    return '#475569';
  };

  const handleMouseDown = (e) => {
    // Don't start drag if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('select')) return;
    
    if (!containerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    dragRef.current = {
      x: containerRef.current.scrollLeft,
      y: containerRef.current.scrollTop
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      e.preventDefault();
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Smooth scrolling in all directions
      containerRef.current.scrollLeft = dragRef.current.x - deltaX;
      containerRef.current.scrollTop = dragRef.current.y - deltaY;
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Loading Family Tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg font-semibold text-gray-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchMembers()}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/** Rendered vansh selector for master admin; others just see their vansh label */}
      {userRole === 'master_admin' && vanshList.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="text-sm text-gray-500 font-medium">Select Vansh</div>
            <select
              value={selectedVansh}
              onChange={(e) => setSelectedVansh(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-700"
            >
              {vanshList.map((v) => (
                <option key={v} value={v}>
                  Vansh {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          
          {/* Left Section - Vansh Label */}
          <div className="text-sm text-gray-400 font-medium">
            {currentUserVansh ? `Vansh ${currentUserVansh}` : 'Vansh'}
          </div>

          {/* Center Section - Navigation Controls */}
          <div className="flex items-center gap-4">
            {/* Navigation Group */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 hover:border-gray-300 transition-colors">
              <button
                type="button"
                onClick={() => {
                  const width = containerRef.current?.clientWidth || 500;
                  scrollByOffset(-width, 0);
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-150"
                title="Scroll Left"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button
                type="button"
                onClick={() => scrollToCenter()}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-all duration-150"
                title="Center View"
              >
                <Navigation size={20} />
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const width = containerRef.current?.clientWidth || 500;
                  scrollByOffset(width, 0);
                }}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-150"
                title="Scroll Right"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Zoom Controls Group */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 hover:border-gray-300 transition-colors">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>

              <div className="px-3 py-1 text-xs font-semibold text-gray-700 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </div>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-150"
                title="Reset Zoom"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
            </div>

            {/* Refresh Button for Admin Users */}
            {(userRole === 'admin' || userRole === 'master_admin') && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-700 shadow-sm"
                title="Refresh Family Tree"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                <span className="text-sm font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {/* Right Section - Spacer */}
          <div className="flex-1"></div>
        </div>
      </div>

      <div className="flex-1 bg-gray-100">
        <div
          ref={containerRef}
          className="w-full h-full overflow-auto px-6 py-10 flex justify-center items-start"
          style={{ 
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        >
          {!layout.nodes.length ? (
            <div className="text-center text-gray-500 text-lg font-medium">
              Select a Vansh to render the family tree.
            </div>
          ) : (
            <div
              className="relative"
              style={{
                width: layout.width,
                height: layout.height,
                transform: `scale(${Math.max(layout.width && containerWidth ? Math.min(1, containerWidth / layout.width) : 1, 0.1) * zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out'
              }}
            >
              <svg
                className="absolute inset-0"
                width={layout.width}
                height={layout.height}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {layout.connectors.map((connector, index) => {
                  if (connector.children.length === 0) return null;
                  const segments = [];
                  const parentX = connector.parentX;
                  const parentBottom = connector.parentBottom;
                  if (connector.children.length === 1) {
                    const child = connector.children[0];
                    segments.push(
                      <line
                        key={`single-${index}`}
                        x1={parentX}
                        y1={parentBottom}
                        x2={child.x}
                        y2={child.y}
                        stroke="#bbb"
                        strokeWidth="1"
                      />
                    );
                  } else {
                    const midY = connector.midY;
                    const minX = Math.min(...connector.children.map(child => child.x));
                    const maxX = Math.max(...connector.children.map(child => child.x));
                    const midX = (minX + maxX) / 2;
                    segments.push(
                      <line
                        key={`parent-${index}`}
                        x1={parentX}
                        y1={parentBottom}
                        x2={parentX}
                        y2={midY}
                        stroke="#bbb"
                        strokeWidth="1"
                      />
                    );
                    segments.push(
                      <line
                        key={`parent-mid-${index}`}
                        x1={parentX}
                        y1={midY}
                        x2={midX}
                        y2={midY}
                        stroke="#bbb"
                        strokeWidth="1"
                      />
                    );
                    segments.push(
                      <line
                        key={`sibling-${index}`}
                        x1={minX}
                        y1={midY}
                        x2={maxX}
                        y2={midY}
                        stroke="#bbb"
                        strokeWidth="1"
                      />
                    );
                    connector.children.forEach((child, childIdx) => {
                      segments.push(
                        <line
                          key={`child-${index}-${childIdx}`}
                          x1={child.x}
                          y1={midY}
                          x2={child.x}
                          y2={connector.childTop}
                          stroke="#bbb"
                          strokeWidth="1"
                        />
                      );
                    });
                  }
                  return segments;
                })}
              </svg>

              {layout.nodes.map((node, idx) => {
                const primary = node.data;
                const showCouple = Boolean(primary?.serNo);
                const spouse = primary?.spouse || null;
                const groupWidth = showCouple ? CARD_WIDTH * 2 + COUPLE_GAP : CARD_WIDTH;
                const spacer = showCouple ? COUPLE_GAP / 2 : 0;
                const primaryLeft = showCouple ? spacer : groupWidth / 2 - CARD_WIDTH / 2;
                const spouseLeft = showCouple ? groupWidth - spacer - CARD_WIDTH : primaryLeft;
                const groupLeft = node.x - groupWidth / 2;
                const groupKey = `node-${primary?.serNo ?? idx}`;
                const cards = [];
                cards.push(
                  <div
                    key={`${groupKey}-primary`}
                    style={{
                      position: 'absolute',
                      left: primaryLeft,
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                      cursor: primary?.serNo ? 'pointer' : 'default'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (primary?.serNo) {
                        navigate(`/family/member/${primary.serNo}`);
                      }
                    }}
                    className="relative rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-2 px-4 text-center transition-all hover:shadow-md"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold tracking-wide border-2 border-white shadow"
                      style={{ backgroundColor: '#e5e7eb', overflow: 'hidden', padding: '4px' }}
                    >
                      {primary?.profileImage ? (
                        <img
                          src={primary.profileImage}
                          alt={primary?.name || 'Profile'}
                          className="w-full h-full rounded-full"
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        getInitials(primary)
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-800 leading-tight">
                        {primary?.name || 'Member'}
                      </p>
                      {primary?.serNo ? (
                        <p className="text-xs font-medium text-orange-500">#{primary.serNo}</p>
                      ) : null}
                      <p className="text-xs text-slate-500">
                        {primary?.vansh ? `Vansh ${primary.vansh}` : 'Vansh N/A'}
                      </p>
                      <p className="text-xs text-slate-500">{formatGender(primary?.gender)}</p>
                      {primary?.level !== undefined && primary?.level !== null ? (
                        <p className="text-xs text-slate-500">Level {primary.level}</p>
                      ) : null}
                    </div>
                  </div>
                );
                if (showCouple) {
                  const hasSpouse = Boolean(spouse && spouse.name);
                  const placeholder = !hasSpouse;
                  const displaySpouse = hasSpouse
                    ? spouse
                    : { name: 'Unknown', gender: '', vansh: primary?.vansh || '', profileImage: null };
                  cards.push(
                    <div
                      key={`${groupKey}-spouse`}
                      style={{
                        position: 'absolute',
                        left: spouseLeft,
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                        cursor: spouse?.serNo ? 'pointer' : 'default'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (spouse?.serNo) {
                          navigate(`/family/member/${spouse.serNo}`);
                        }
                      }}
                      className={`relative rounded-2xl ${
                        placeholder
                          ? 'border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400'
                          : 'border border-slate-200 bg-white text-slate-800'
                      } shadow-sm flex flex-col items-center justify-center gap-2 px-4 text-center transition-all ${!placeholder ? 'hover:shadow-md' : ''}`}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold tracking-wide border-2 border-white shadow"
                        style={{
                          backgroundColor: placeholder ? '#e2e8f0' : '#e5e7eb',
                          overflow: 'hidden',
                          padding: '4px'
                        }}
                      >
                        {displaySpouse?.profileImage ? (
                          <img
                            src={displaySpouse.profileImage}
                            alt={displaySpouse?.name || 'Profile'}
                            className="w-full h-full rounded-full"
                            style={{ objectFit: 'contain' }}
                          />
                        ) : (
                          getInitials(displaySpouse)
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold leading-tight">
                          {displaySpouse?.name || 'Unknown'}
                        </p>
                        {displaySpouse?.serNo ? (
                          <p className="text-xs font-medium text-orange-500">#{displaySpouse.serNo}</p>
                        ) : null}
                        <p className="text-xs text-slate-500">
                          {displaySpouse?.vansh ? `Vansh ${displaySpouse.vansh}` : 'Vansh N/A'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {placeholder ? 'Unknown' : formatGender(displaySpouse?.gender)}
                        </p>
                        {!placeholder && displaySpouse?.level !== undefined && displaySpouse?.level !== null ? (
                          <p className="text-xs text-slate-500">Level {displaySpouse.level}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={groupKey}
                    style={{
                      position: 'absolute',
                      left: groupLeft,
                      top: node.y,
                      width: groupWidth,
                      height: CARD_HEIGHT
                    }}
                  >
                    {showCouple ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: primaryLeft + CARD_WIDTH,
                          top: CARD_HEIGHT / 2 - 1,
                          width: COUPLE_GAP,
                          height: 1,
                          backgroundColor: '#bbb',
                          pointerEvents: 'none'
                        }}
                      />
                    ) : null}
                    {cards.map(card => card)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kulavruksh;

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function deduplicateMembers(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Map();
  list.forEach(member => {
    if (!member || typeof member !== 'object') return;
    const key = generateMemberKey(member);
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, cloneMember(member));
      return;
    }
    const existing = seen.get(key);
    const merged = mergeMemberRecords(existing, member);
    seen.set(key, merged);
  });
  return Array.from(seen.values());
}

function generateMemberKey(member) {
  const personal = member.personalDetails || {};
  const identifiers = [
    member.serNo,
    personal.serNo,
    member.sNo,
    personal.sNo,
    member.serialNo,
    personal.serialNo,
    member.serialNumber,
    personal.serialNumber,
    member.memberSerialNumber,
    personal.memberSerialNumber,
    member._id,
    member.id,
    personal.memberId,
    personal.id,
    member.memberId,
    member.uuid,
    personal.uuid,
    member.uniqueId
  ];
  for (const value of identifiers) {
    const key = normalizeSerNoKey(value);
    if (key) {
      return key;
    }
  }
  const fallback = {
    name: composeNameKey(member),
    spouse: composeSpouseKey(member),
    vansh: `${personal.vansh ?? member.vansh ?? ''}`.trim().toLowerCase()
  };
  return JSON.stringify(fallback);
}

function normalizeSerNoKey(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeSerNoKey(item);
      if (normalized) return normalized;
    }
    return null;
  }
  if (typeof value === 'object') {
    if (typeof value.$numberLong === 'string') return value.$numberLong.trim();
    if (typeof value.$numberInt === 'string') return value.$numberInt.trim();
    if (typeof value.$numberDouble === 'string') return value.$numberDouble.trim();
    if (typeof value.$value === 'string') return value.$value.trim();
    if (typeof value.value === 'string') return value.value.trim();
    return null;
  }
  const stringValue = `${value}`.trim();
  if (!stringValue) return null;
  const numeric = normalizeNumber(stringValue);
  if (numeric !== null) {
    return String(numeric);
  }
  return stringValue.toLowerCase();
}

function mergeMemberRecords(existing, candidate) {
  const existingScore = completenessScore(existing);
  const candidateScore = completenessScore(candidate);
  const useCandidate = candidateScore > existingScore;
  const primarySource = useCandidate ? candidate : existing;
  const secondarySource = useCandidate ? existing : candidate;
  const merged = cloneMember(primarySource);
  merged.personalDetails = mergeObjectFields(primarySource.personalDetails, secondarySource.personalDetails);
  merged.marriedDetails = mergeObjectFields(primarySource.marriedDetails, secondarySource.marriedDetails);
  merged.childrenSerNos = mergeSerNoArray(primarySource.childrenSerNos, secondarySource.childrenSerNos);
  merged.sonDaughterSerNo = mergeSerNoArray(primarySource.sonDaughterSerNo, secondarySource.sonDaughterSerNo);
  merged.spouseSerNo = selectPreferredValue(merged.spouseSerNo, secondarySource.spouseSerNo);
  merged.fatherSerNo = selectPreferredValue(merged.fatherSerNo, secondarySource.fatherSerNo);
  merged.motherSerNo = selectPreferredValue(merged.motherSerNo, secondarySource.motherSerNo);
  merged.vansh = selectPreferredValue(primarySource.vansh, secondarySource.vansh);
  merged.level = selectPreferredValue(primarySource.level, secondarySource.level);
  merged.name = selectPreferredValue(primarySource.name, secondarySource.name);
  merged.fullName = selectPreferredValue(primarySource.fullName, secondarySource.fullName);
  merged.firstName = selectPreferredValue(primarySource.firstName, secondarySource.firstName);
  merged.middleName = selectPreferredValue(primarySource.middleName, secondarySource.middleName);
  merged.lastName = selectPreferredValue(primarySource.lastName, secondarySource.lastName);
  merged.gender = selectPreferredValue(primarySource.gender, secondarySource.gender);
  merged.profileImage = selectPreferredValue(primarySource.profileImage, secondarySource.profileImage);
  merged.email = selectPreferredValue(primarySource.email, secondarySource.email);
  merged.mobileNumber = selectPreferredValue(primarySource.mobileNumber, secondarySource.mobileNumber);
  merged.dateOfBirth = selectPreferredValue(primarySource.dateOfBirth, secondarySource.dateOfBirth);
  merged.dob = selectPreferredValue(primarySource.dob, secondarySource.dob);
  merged.isAlive = selectPreferredValue(primarySource.isAlive, secondarySource.isAlive);
  merged.status = selectPreferredValue(primarySource.status, secondarySource.status);
  merged._original = selectPreferredValue(primarySource._original, secondarySource._original);
  assignNormalizedRelationFields(merged);
  return merged;
}

function completenessScore(member) {
  if (!member || typeof member !== 'object') return 0;
  let score = 0;
  const personal = member.personalDetails || {};
  if (hasMeaningfulValue(member.fatherSerNo)) score += 4;
  if (hasMeaningfulValue(member.motherSerNo)) score += 3;
  if (hasMeaningfulValue(member.spouseSerNo)) score += 2;
  if (hasMeaningfulValue(member.childrenSerNos)) score += 5;
  if (hasMeaningfulValue(member.sonDaughterSerNo)) score += 2;
  if (hasMeaningfulValue(member.level)) score += 1;
  if (hasMeaningfulValue(personal.vansh ?? member.vansh)) score += 1;
  if (hasMeaningfulValue(personal.firstName ?? member.firstName)) score += 1;
  if (hasMeaningfulValue(personal.lastName ?? member.lastName)) score += 1;
  return score;
}

function mergeObjectFields(primary, secondary) {
  const base = { ...(primary || {}) };
  const source = secondary || {};
  Object.keys(source).forEach(key => {
    if (!hasMeaningfulValue(base[key]) && hasMeaningfulValue(source[key])) {
      base[key] = source[key];
    }
  });
  return base;
}

function mergeSerNoArray(first, second) {
  const result = [];
  const seen = new Set();
  const add = value => {
    const key = normalizeSerNoKey(value);
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    const numeric = normalizeNumber(key);
    result.push(numeric !== null ? numeric : key);
  };
  forEachSerNoValue(first, add);
  forEachSerNoValue(second, add);
  return result;
}

function composeNameKey(member) {
  if (!member || typeof member !== 'object') return '';
  const personal = member.personalDetails || {};
  const first = (personal.firstName ?? member.firstName ?? '').trim().toLowerCase();
  const middle = (personal.middleName ?? member.middleName ?? '').trim().toLowerCase();
  const last = (personal.lastName ?? member.lastName ?? '').trim().toLowerCase();
  const full = (member.fullName ?? member.name ?? '').trim().toLowerCase();
  if (full) return full;
  return [first, middle, last].filter(Boolean).join(' ');
}

function composeSpouseKey(member) {
  if (!member || typeof member !== 'object') return '';
  const married = member.marriedDetails || {};
  const spouseName = `${married.spouseFirstName ?? ''} ${married.spouseMiddleName ?? ''} ${married.spouseLastName ?? ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (spouseName) return spouseName;
  const spouseSerNo = normalizeSerNoKey(member.spouseSerNo);
  if (spouseSerNo) return `spouse:${spouseSerNo}`;
  return '';
}

function selectPreferredValue(primary, fallback) {
  return hasMeaningfulValue(primary) ? primary : fallback;
}

function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function cloneMember(member) {
  return JSON.parse(JSON.stringify(member));
}

function forEachSerNoValue(source, callback) {
  if (!source) return;
  if (Array.isArray(source)) {
    source.forEach(item => forEachSerNoValue(item, callback));
    return;
  }
  if (typeof source === 'object') {
    const candidates = [];
    if (source.serNo !== undefined) candidates.push(source.serNo);
    if (source.serialNo !== undefined) candidates.push(source.serialNo);
    if (source.serialNumber !== undefined) candidates.push(source.serialNumber);
    if (source.$numberLong !== undefined) candidates.push(source.$numberLong);
    if (source.$numberInt !== undefined) candidates.push(source.$numberInt);
    if (source.$numberDouble !== undefined) candidates.push(source.$numberDouble);
    if (source.$value !== undefined) candidates.push(source.$value);
    if (source.value !== undefined) candidates.push(source.value);
    if (source.id !== undefined) candidates.push(source.id);
    if (source.memberId !== undefined) candidates.push(source.memberId);
    if (source.uuid !== undefined) candidates.push(source.uuid);
    if (source.uniqueId !== undefined) candidates.push(source.uniqueId);
    candidates.forEach(item => forEachSerNoValue(item, callback));
    return;
  }
  callback(source);
}

function assignNormalizedRelationFields(member) {
  member.serNo = normalizeSerNoField(member.serNo, member.personalDetails && member.personalDetails.serNo);
  member.spouseSerNo = normalizeSerNoField(member.spouseSerNo, member.marriedDetails && member.marriedDetails.spouseSerNo);
  member.fatherSerNo = normalizeSerNoField(member.fatherSerNo, member.personalDetails && member.personalDetails.fatherSerNo);
  member.motherSerNo = normalizeSerNoField(member.motherSerNo, member.personalDetails && member.personalDetails.motherSerNo);
  if (Array.isArray(member.childrenSerNos) && member.childrenSerNos.length > 0) {
    member.childrenSerNos = mergeSerNoArray(member.childrenSerNos, []);
  }
  if (Array.isArray(member.sonDaughterSerNo) && member.sonDaughterSerNo.length > 0) {
    member.sonDaughterSerNo = mergeSerNoArray(member.sonDaughterSerNo, []);
  }
}

function normalizeSerNoField(primary, secondary) {
  const fromPrimary = normalizeSerNoKey(primary);
  if (fromPrimary) {
    const numeric = normalizeNumber(fromPrimary);
    return numeric !== null ? numeric : fromPrimary;
  }
  const fromSecondary = normalizeSerNoKey(secondary);
  if (fromSecondary) {
    const numeric = normalizeNumber(fromSecondary);
    return numeric !== null ? numeric : fromSecondary;
  }
  return null;
}

function buildFamilyTree(members) {
  const memberMap = new Map();
  members.forEach(member => {
    const serNo = normalizeNumber(member.serNo);
    if (serNo !== null) {
      memberMap.set(serNo, member);
      if (serNo === 1 || serNo === 28) {
        console.log(`DEBUG memberMap ADD serNo=${serNo}, fatherSerNo=${member.fatherSerNo}`);
      }
    }
  });

  // CHILD-DRIVEN ALGORITHM
  // Each member finds their father, not father finding children
  const processed = new Set();

  const buildNode = serNo => {
    const normalized = normalizeNumber(serNo);
    if (normalized === null) return null;
    if (!memberMap.has(normalized)) return null;
    if (processed.has(normalized)) return null;

    processed.add(normalized);
    const member = memberMap.get(normalized);

    // Get spouse info (just metadata, doesn't affect tree position)
    const spouseSerNo = normalizeNumber(member.spouseSerNo);
    const spouse = spouseSerNo !== null ? memberMap.get(spouseSerNo) : null;

    // Check if this member is an external branch (female who married out of the family)
    const isExternalBranch = () => {
      const personal = member.personalDetails || {};
      const gender = personal.gender || member.gender || '';
      const lastName = personal.lastName || member.lastName || '';
      
      // If female and last name is not Gogte/Gogate, exclude her children
      if (gender.toLowerCase() === 'female' && 
          lastName.toLowerCase() !== 'gogte' && 
          lastName.toLowerCase() !== 'gogate') {
        return true;
      }
      return false;
    };

    // Find all children of this member (look for members whose fatherSerNo === this member's serNo)
    // But only if this member is not an external branch
    const childrenSerNos = [];
    if (!isExternalBranch()) {
      members.forEach(potentialChild => {
        const childSerNo = normalizeNumber(potentialChild.serNo);
        if (childSerNo === null) return;
        const childFatherSerNo = normalizeNumber(potentialChild.fatherSerNo);
        if (childFatherSerNo === normalized) {
          childrenSerNos.push(childSerNo);
        }
      });
    }

    // Recursively build children
    const children = [];
    childrenSerNos.forEach(childSerNo => {
      const childNode = buildNode(childSerNo);
      if (childNode) {
        children.push(childNode);
      }
    });

    return {
      primary: member,
      spouse,
      children
    };
  };

  // Find all root members (those with no father in memberMap)
  // Exclude external spouses (those with no fatherSerNo who are spouses of someone in the tree)
  const rootSerNos = [];
  members.forEach(member => {
    const serNo = normalizeNumber(member.serNo);
    if (serNo === null) return;
    const fatherSerNo = normalizeNumber(member.fatherSerNo);
    
    // Only include as root if:
    // 1. They have a father and that father is in the tree (they're part of hierarchy)
    // OR
    // 2. They have no father (true root)
    if (fatherSerNo === null || !memberMap.has(fatherSerNo)) {
      rootSerNos.push(serNo);
    }
  });

  console.log('DEBUG ROOT MEMBERS:', rootSerNos.map(serNo => {
    const member = memberMap.get(serNo);
    return {
      serNo,
      name: member.name,
      fatherSerNo: member.fatherSerNo,
      spouseSerNo: member.spouseSerNo,
      isSpouse: member.spouseSerNo ? 'MAYBE SPOUSE' : 'LIKELY ROOT'
    };
  }));

  // If multiple roots exist, keep only the one with the largest tree to avoid multiple separate trees
  let primaryRootSerNo = null;
  if (rootSerNos.length > 1) {
    let maxDescendants = -1;
    const countDescendants = serNo => {
      let count = 1; // Count self
      const childSerNos = [];
      members.forEach(potentialChild => {
        const childSerNo = normalizeNumber(potentialChild.serNo);
        if (childSerNo === null) return;
        const childFatherSerNo = normalizeNumber(potentialChild.fatherSerNo);
        if (childFatherSerNo === serNo) {
          childSerNos.push(childSerNo);
        }
      });
      childSerNos.forEach(childSerNo => {
        count += countDescendants(childSerNo);
      });
      return count;
    };

    rootSerNos.forEach(rootSerNo => {
      const descendantCount = countDescendants(rootSerNo);
      console.log(`DEBUG ROOT ${rootSerNo} has ${descendantCount} descendants`);
      if (descendantCount > maxDescendants) {
        maxDescendants = descendantCount;
        primaryRootSerNo = rootSerNo;
      }
    });
    console.log(`DEBUG Selected primary root: ${primaryRootSerNo} with ${maxDescendants} descendants`);
  } else if (rootSerNos.length === 1) {
    primaryRootSerNo = rootSerNos[0];
  }

  // Build tree starting from primary root only
  const tree = [];
  if (primaryRootSerNo !== null) {
    const node = buildNode(primaryRootSerNo);
    if (node) {
      tree.push(node);
    }
  }

  return tree;
}

function buildLayout(root) {
  if (!root) return { nodes: [], connectors: [], width: 0, height: 0 };
  if (Array.isArray(root)) {
    if (root.length === 0) {
      return { nodes: [], connectors: [], width: 0, height: 0 };
    }
    if (root.length === 1) {
      return buildLayout(root[0]);
    }
    const virtualRoot = {
      serNo: null,
      name: '',
      gender: '',
      vansh: '',
      profileImage: null,
      spouse: null,
      children: root
    };
    return buildLayout(virtualRoot);
  }
  const normalized = normalizeTreeNode(root);
  const widthMap = new Map();
  const computeWidth = node => {
    const children = Array.isArray(node.children) ? node.children : [];
    if (children.length === 0) {
      widthMap.set(node, 1);
      return 1;
    }
    let total = 0;
    children.forEach(child => {
      total += computeWidth(child);
    });
    const width = Math.max(total, children.length, 1);
    widthMap.set(node, width);
    return width;
  };
  const totalUnits = computeWidth(normalized);
  const nodes = [];
  const connectors = [];
  let maxDepth = 0;
  const traverse = (node, depth, offset) => {
    const width = widthMap.get(node) || 1;
    const centerUnits = offset + width / 2;
    const x = CANVAS_PADDING_X + centerUnits * HORIZONTAL_UNIT;
    const y = CANVAS_PADDING_TOP + depth * VERTICAL_UNIT;
    nodes.push({ data: node, x, y, depth });
    maxDepth = Math.max(maxDepth, depth);
    const children = Array.isArray(node.children) ? node.children : [];
    if (children.length === 0) return;
    let childOffset = offset;
    const childCenters = [];
    children.forEach(child => {
      const childWidth = widthMap.get(child) || 1;
      const childCenterUnits = childOffset + childWidth / 2;
      const childX = CANVAS_PADDING_X + childCenterUnits * HORIZONTAL_UNIT;
      childCenters.push(childX);
      traverse(child, depth + 1, childOffset);
      childOffset += childWidth;
    });
    const parentBottom = y + CARD_HEIGHT;
    const childTop = CANVAS_PADDING_TOP + (depth + 1) * VERTICAL_UNIT;
    const midY = parentBottom + CONNECTOR_GAP;
    const childrenCoordinates = childCenters.map(centerX => ({ x: centerX, y: childTop }));
    connectors.push({
      parentX: x,
      parentBottom,
      childTop,
      midY,
      children: childrenCoordinates
    });
  };
  traverse(normalized, 0, 0);
  const width = totalUnits * HORIZONTAL_UNIT + CANVAS_PADDING_X * 2;
  const height =
    CANVAS_PADDING_TOP +
    (maxDepth + 1) * VERTICAL_UNIT +
    CARD_HEIGHT +
    CANVAS_PADDING_BOTTOM;
  return { nodes, connectors, width, height };
}

function normalizeTreeNode(node) {
  if (!node || typeof node !== 'object') {
    return { serNo: null, name: '', gender: '', vansh: '', level: '', profileImage: null, spouse: null, children: [] };
  }
  const children = Array.isArray(node.children) ? node.children.map(normalizeTreeNode) : [];
  return {
    serNo: node.serNo ?? null,
    name: node.name ?? '',
    gender: node.gender ?? '',
    vansh: node.vansh ?? '',
    level: node.level ?? '',
    profileImage: node.profileImage ?? null,
    spouse: node.spouse
      ? {
          serNo: node.spouse.serNo ?? null,
          name: node.spouse.name ?? '',
          gender: node.spouse.gender ?? '',
          vansh: node.spouse.vansh ?? '',
          level: node.spouse.level ?? '',
          profileImage: node.spouse.profileImage ?? null
        }
      : null,
    children
  };
}

function convertTreeNodeToLayout(treeNode) {
  const primaryMember = treeNode.primary || {};
  const spouseMember = treeNode.spouse || null;
  return {
    serNo: normalizeNumber(primaryMember.serNo),
    name: getMemberName(primaryMember),
    gender: getMemberGender(primaryMember),
    vansh: getMemberVansh(primaryMember),
    level: getMemberLevel(primaryMember),
    profileImage: resolveProfileImageSrc(selectProfileImageSource(primaryMember)),
    spouse: spouseMember
      ? {
          serNo: normalizeNumber(spouseMember.serNo),
          name: getMemberName(spouseMember),
          gender: getMemberGender(spouseMember),
          vansh: getMemberVansh(spouseMember) || getMemberVansh(primaryMember),
          level: getMemberLevel(spouseMember),
          profileImage: resolveProfileImageSrc(selectProfileImageSource(spouseMember))
        }
      : null,
    children: Array.isArray(treeNode.children) ? treeNode.children.map(convertTreeNodeToLayout) : []
  };
}

function getMemberName(member) {
  const personal = member.personalDetails || {};
  const parts = [personal.firstName, personal.middleName, personal.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return member.fullName || member.name || member.memberName || `Member ${member.serNo ?? ''}`;
}

function getMemberGender(member) {
  const personal = member.personalDetails || {};
  return personal.gender || member.gender || member.sex || '';
}

function getMemberVansh(member) {
  const personal = member.personalDetails || {};
  return personal.vansh ?? member.vansh ?? '';
}

function getMemberLevel(member) {
  return member?.level !== undefined && member?.level !== null ? member.level : '';
}
