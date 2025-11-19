import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import RelationCard from './RelationCard';

const RelationSection = ({ title, icon: Icon, members, isExpanded, onToggle }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#f0e0d4] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all duration-200 ease-out hover:bg-[#fff4ed]"
      >
        <div className="flex items-center gap-3">
          {Icon ? <Icon className="h-5 w-5 text-[#b05a2b]" /> : null}
          <div className="text-sm font-semibold text-[#2b2b2b]">{title}</div>
          <span className="rounded-full bg-[#fff0e6] px-2 py-[1px] text-xs font-medium text-[#b05a2b]">
            {members.length}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#b05a2b] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="border-t border-[#f0e0d4] px-5 py-4">
              <div className="mt-2 rounded-xl border border-[#f0e0d4] bg-[#fff9f5] p-3">
                <motion.div
                  layout
                  className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 transition-all duration-200"
                >
                  {members.map((relation) => {
                    const memberId = relation?.member?.sNo || relation?.member?.serNo || relation?.member?._id || relation?.relationEnglish;
                    return (
                      <motion.div
                        key={`${relation?.relationEnglish}-${memberId}`}
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <RelationCard relation={relation} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RelationSection;
