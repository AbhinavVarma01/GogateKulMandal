import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Baby, Home, Users, Users2, Sparkles, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import RelationSection from './RelationSection';

const GROUP_ICON_MAP = {
  Spouse: Heart,
  Children: Baby,
  Parents: Home,
  Siblings: Users,
  Grandparents: Sparkles,
  Grandchildren: Baby,
  'Uncles & Aunts': Users2,
  Cousins: Users,
  'Nieces & Nephews': Baby,
  'In-laws': Link2
};

const RelationsPanel = ({ relationGroups }) => {
  const groupKeys = useMemo(() => relationGroups.map((group) => group.key), [relationGroups]);
  const [expanded, setExpanded] = useState(new Set(groupKeys));

  useEffect(() => {
    setExpanded(new Set(groupKeys));
  }, [groupKeys.join('|')]);

  const toggleSection = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(groupKeys));
  const collapseAll = () => setExpanded(new Set());

  const allExpanded = expanded.size === groupKeys.length;
  const allCollapsed = expanded.size === 0;

  return (
    <div className="relative lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2">
      <div className="rounded-2xl border border-[#f0e0d4] bg-white p-6 shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">Relations</h2>
            <p className="text-xs text-[#a17c61]">Explore connected members</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className={`inline-flex items-center gap-1 rounded-full border border-[#f0e0d4] px-3 py-[3px] text-xs font-medium text-[#b05a2b] transition-all duration-200 ease-out hover:bg-[#fff0e6] ${allExpanded ? 'bg-[#fff0e6]' : ''}`}
            >
              <ChevronDown size={14} />
              Expand
            </button>
            <button
              onClick={collapseAll}
              className={`inline-flex items-center gap-1 rounded-full border border-[#f0e0d4] px-3 py-[3px] text-xs font-medium text-[#b05a2b] transition-all duration-200 ease-out hover:bg-[#fff0e6] ${allCollapsed ? 'bg-[#fff0e6]' : ''}`}
            >
              <ChevronUp size={14} />
              Collapse
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {relationGroups.map((group) => (
            <RelationSection
              key={group.key}
              title={group.key}
              icon={GROUP_ICON_MAP[group.key] || Users2}
              members={group.members}
              isExpanded={expanded.has(group.key)}
              onToggle={() => toggleSection(group.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelationsPanel;
