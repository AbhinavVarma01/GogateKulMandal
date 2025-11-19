import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
import './DescendantTree.css';

const CARD_WIDTH = 200;
const CARD_HEIGHT = 190;
const COUPLE_GAP = 32;
const HORIZONTAL_UNIT = 520;
const VERTICAL_UNIT = 260;
const CANVAS_PADDING_X = 200;
const CANVAS_PADDING_TOP = 80;
const CANVAS_PADDING_BOTTOM = 120;
const CONNECTOR_GAP = 20;

const selectProfileImageSource = entity => {
  if (!entity || typeof entity !== 'object') return null;
  const keys = ['profileImage', 'profile_image', 'profileImageUrl', 'image', 'photo', 'avatar'];
  for (const key of keys) {
    const value = entity[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  if (entity.personalDetails && typeof entity.personalDetails === 'object') {
    const nested = selectProfileImageSource(entity.personalDetails);
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
  }
  return null;
};

const normalizeNumber = value => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const composeNameKey = person => {
  if (!person) return '';
  const firstName = person.firstName || person.personalDetails?.firstName || '';
  const lastName = person.lastName || person.personalDetails?.lastName || '';
  return `${firstName} ${lastName}`.trim().toLowerCase();
};

function buildDescendantTree(startMember, allMembers) {
  if (!startMember || !Array.isArray(allMembers)) return null;

  const memberMap = new Map();
  allMembers.forEach(member => {
    const serNo = normalizeNumber(member.serNo || member.sNo);
    if (serNo !== null) {
      memberMap.set(serNo, member);
    }
  });

  const buildNode = (serNo, visited = new Set()) => {
    if (serNo === null || visited.has(serNo)) return null;
    visited.add(serNo);

    const member = memberMap.get(serNo);
    if (!member) return null;

    // Get spouse
    let spouse = null;
    const spouseSerNo = normalizeNumber(member.spouseSerNo);
    if (spouseSerNo !== null && memberMap.has(spouseSerNo)) {
      spouse = memberMap.get(spouseSerNo);
    }

    // Get children
    const childrenSerNos = [];
    allMembers.forEach(potentialChild => {
      const childSerNo = normalizeNumber(potentialChild.serNo || potentialChild.sNo);
      if (childSerNo === null) return;
      const childFatherSerNo = normalizeNumber(potentialChild.fatherSerNo);
      if (childFatherSerNo === serNo) {
        childrenSerNos.push(childSerNo);
      }
    });

    const children = [];
    childrenSerNos.forEach(childSerNo => {
      const childNode = buildNode(childSerNo, visited);
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

  const startSerNo = normalizeNumber(startMember.serNo || startMember.sNo);
  if (startSerNo === null) return null;

  const tree = buildNode(startSerNo);
  return tree ? [tree] : null;
}

function buildLayout(root) {
  if (!root) return { nodes: [], connectors: [], width: 0, height: 0 };
  if (Array.isArray(root)) {
    if (root.length === 0) return { nodes: [], connectors: [], width: 0, height: 0 };
    if (root.length === 1) return buildLayout(root[0]);
    return buildLayout(root[0]);
  }

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

  const totalUnits = computeWidth(root);
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

  traverse(root, 0, 0);
  const width = totalUnits * HORIZONTAL_UNIT + CANVAS_PADDING_X * 2;
  const height =
    CANVAS_PADDING_TOP +
    (maxDepth + 1) * VERTICAL_UNIT +
    CARD_HEIGHT +
    CANVAS_PADDING_BOTTOM;

  return { nodes, connectors, width, height };
}

const DescendantTree = ({ member, allMembers, onNodeClick, variant = 'default' }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ x: 0, y: 0 });
  const isKulavrukshStyle = variant === 'kulavruksh';

  const handleNodeClick = (clickedMember) => {
    if (onNodeClick) {
      onNodeClick(clickedMember);
    }
    const serNo = clickedMember.serNo || clickedMember.sNo;
    if (serNo) {
      navigate(`/family/member/${serNo}`);
    }
  };

  const treeData = useMemo(() => {
    if (!member || !allMembers) return null;
    return buildDescendantTree(member, allMembers);
  }, [member, allMembers]);

  const layout = useMemo(() => {
    if (!treeData) return { nodes: [], connectors: [], width: 0, height: 0 };
    return buildLayout(treeData);
  }, [treeData]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateWidth = () => {
      setContainerWidth(element.getBoundingClientRect().width);
    };
    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scrollToCenter = () => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = 0;
  };

  useEffect(() => {
    if (layout.nodes.length > 0) {
      scrollToCenter();
    }
  }, [layout.nodes.length]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  const scrollByOffset = (dx, dy) => {
    if (!containerRef.current) return;
    containerRef.current.scrollLeft += dx;
    containerRef.current.scrollTop += dy;
  };

  const handleMouseDown = (e) => {
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

  const getMemberName = (person) => {
    if (!person) return 'Unknown';
    const firstName = person.firstName || person.personalDetails?.firstName || '';
    const lastName = person.lastName || person.personalDetails?.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  const getGender = (person) => {
    if (!person) return 'unknown';
    const gender = (person.gender || person.personalDetails?.gender || '').toString().toLowerCase();
    return gender || 'unknown';
  };

  const getInitials = (person) => {
    const name = getMemberName(person);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  if (!treeData) {
    return (
      <div className={isKulavrukshStyle ? 'descendant-tree-empty descendant-tree-empty--kulavruksh' : 'flex items-center justify-center h-96 text-center'}>
        <div className={isKulavrukshStyle ? 'descendant-tree-empty-text' : 'text-gray-500'}>
          <p className="font-medium text-lg mb-2">No descendants found</p>
          <p className="text-sm">{getMemberName(member)} has no children recorded.</p>
        </div>
      </div>
    );
  }

  const wrapperClassName = `descendant-tree-wrapper${isKulavrukshStyle ? ' descendant-tree-wrapper--kulavruksh' : ''}`;
  const toolbarClassName = `descendant-tree-toolbar${isKulavrukshStyle ? ' descendant-tree-toolbar--kulavruksh' : ''}`;
  const controlGroupClassName = `control-group${isKulavrukshStyle ? ' control-group--kulavruksh' : ''}`;
  const toolbarButtonClassName = `toolbar-btn${isKulavrukshStyle ? ' toolbar-btn--kulavruksh' : ''}`;
  const toolbarButtonTextClassName = `toolbar-btn toolbar-btn-text${isKulavrukshStyle ? ' toolbar-btn--kulavruksh toolbar-btn-text--kulavruksh' : ''}`;
  const zoomIndicatorClassName = `zoom-indicator${isKulavrukshStyle ? ' zoom-indicator--kulavruksh' : ''}`;
  const canvasClassName = `descendant-tree-canvas${isKulavrukshStyle ? ' descendant-tree-canvas--kulavruksh' : ''}`;
  const baseScale = isKulavrukshStyle && layout.width && containerWidth
    ? Math.max(Math.min(1, containerWidth / layout.width), 0.1)
    : 1;

  return (
    <div className={wrapperClassName}>
      {/* Toolbar */}
      <div className={toolbarClassName}>
        <div className="toolbar-left">
          <div className={controlGroupClassName}>
            <button
              onClick={() => {
                const width = containerRef.current?.clientWidth || 500;
                scrollByOffset(-width, 0);
              }}
              className={toolbarButtonClassName}
              title="Scroll Left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollToCenter}
              className={toolbarButtonClassName}
              title="Center View"
            >
              <Navigation size={18} />
            </button>
            <button
              onClick={() => {
                const width = containerRef.current?.clientWidth || 500;
                scrollByOffset(width, 0);
              }}
              className={toolbarButtonClassName}
              title="Scroll Right"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={controlGroupClassName}>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className={toolbarButtonClassName}
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className={zoomIndicatorClassName}>{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleResetZoom}
              className={toolbarButtonTextClassName}
              title="Reset Zoom"
            >
              Reset
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className={toolbarButtonClassName}
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div
        ref={containerRef}
        className={canvasClassName}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="tree-content"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${baseScale * zoom})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Connectors */}
          <svg
            className="tree-connectors"
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
                    stroke="#d1d5db"
                    strokeWidth="2"
                  />
                );
              } else {
                const midY = connector.midY;
                const minX = Math.min(...connector.children.map(child => child.x));
                const maxX = Math.max(...connector.children.map(child => child.x));

                segments.push(
                  <line
                    key={`parent-${index}`}
                    x1={parentX}
                    y1={parentBottom}
                    x2={parentX}
                    y2={midY}
                    stroke="#d1d5db"
                    strokeWidth="2"
                  />
                );
                segments.push(
                  <line
                    key={`parent-mid-${index}`}
                    x1={minX}
                    y1={midY}
                    x2={maxX}
                    y2={midY}
                    stroke="#d1d5db"
                    strokeWidth="2"
                  />
                );

                connector.children.forEach((child, childIndex) => {
                  segments.push(
                    <line
                      key={`child-${index}-${childIndex}`}
                      x1={child.x}
                      y1={midY}
                      x2={child.x}
                      y2={child.y}
                      stroke="#d1d5db"
                      strokeWidth="2"
                    />
                  );
                });
              }
              return segments;
            })}
          </svg>

          {/* Nodes */}
          {layout.nodes.map((node, index) => {
            const person = node.data.primary;
            const spouse = node.data.spouse;
            const gender = getGender(person);
            const borderColor = gender === 'male' ? '#3b82f6' : gender === 'female' ? '#ec4899' : '#9ca3af';
            const imageSrc = resolveProfileImageSrc(selectProfileImageSource(person));

            return (
              <div
                key={index}
                className="tree-node-container"
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
              >
                {spouse ? (
                  <div className="couple-group">
                    <div
                      className="tree-node-card"
                      style={{ borderLeftColor: borderColor }}
                      onClick={() => handleNodeClick(person)}
                    >
                      <div className="node-avatar">
                        {imageSrc ? (
                          <img src={imageSrc} alt={getMemberName(person)} />
                        ) : (
                          <span>{getInitials(person)}</span>
                        )}
                      </div>
                      <div className="node-info">
                        <div className="node-name">{getMemberName(person)}</div>
                        <div className="node-tags">
                          <span className="tag gender">{gender === 'male' ? '♂ Male' : gender === 'female' ? '♀ Female' : 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="spouse-connector" />

                    <div
                      className="tree-node-card spouse-card"
                      style={{ borderLeftColor: getGender(spouse) === 'male' ? '#3b82f6' : '#ec4899' }}
                      onClick={() => handleNodeClick(spouse)}
                    >
                      <div className="node-avatar">
                        {resolveProfileImageSrc(selectProfileImageSource(spouse)) ? (
                          <img src={resolveProfileImageSrc(selectProfileImageSource(spouse))} alt={getMemberName(spouse)} />
                        ) : (
                          <span>{getInitials(spouse)}</span>
                        )}
                      </div>
                      <div className="node-info">
                        <div className="node-name">{getMemberName(spouse)}</div>
                        <div className="node-tags">
                          <span className="tag gender">{getGender(spouse) === 'male' ? '♂ Male' : '♀ Female'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="tree-node-card"
                    style={{ borderLeftColor: borderColor }}
                    onClick={() => handleNodeClick(person)}
                  >
                    <div className="node-avatar">
                      {imageSrc ? (
                        <img src={imageSrc} alt={getMemberName(person)} />
                      ) : (
                        <span>{getInitials(person)}</span>
                      )}
                    </div>
                    <div className="node-info">
                      <div className="node-name">{getMemberName(person)}</div>
                      <div className="node-tags">
                        <span className="tag gender">{gender === 'male' ? '♂ Male' : gender === 'female' ? '♀ Female' : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DescendantTree;