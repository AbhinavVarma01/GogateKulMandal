import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import ProfileCard from './ProfileCard';
import RelationsPanel from './RelationsPanel';
import relationRules from '../../data/relationRules.json';

const ORDERED_GROUPS = [
  'Spouse',
  'Children',
  'Parents',
  'Siblings',
  'Grandparents',
  'Grandchildren',
  'Uncles & Aunts',
  'Cousins',
  'Nieces & Nephews',
  'In-laws'
];

const normalizeId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeTextKey = (value) => (value ? value.replace(/[’]/g, "'") : '');

const buildFullName = (person) => {
  const personal = person?.personalDetails || {};
  return [personal.firstName, personal.middleName, personal.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const getGender = (person) => {
  const gender = person?.personalDetails?.gender || person?.gender || '';
  return gender ? gender.toString().toLowerCase() : '';
};

const createRelationLookup = () => {
  const map = new Map();
  relationRules.forEach((rule) => {
    const key = normalizeTextKey(rule.relationEnglish);
    if (!map.has(key)) {
      map.set(key, {
        english: rule.relationEnglish,
        marathi: rule.relationMarathi || ''
      });
    }
  });
  return map;
};

const useRelations = (member, allMembers) => {
  const relationLookup = useMemo(createRelationLookup, []);

  return useMemo(() => {
    if (!member) return [];

    const membersArray = Array.isArray(allMembers) ? allMembers : [];
    const membersById = new Map();
    membersArray.forEach((item) => {
      const id = normalizeId(item?.sNo ?? item?.serNo);
      if (id) {
        membersById.set(id, item);
      }
    });

    const currentId = normalizeId(member?.sNo ?? member?.serNo);
    if (currentId && !membersById.has(currentId)) {
      membersById.set(currentId, member);
    }

    const groups = ORDERED_GROUPS.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

    const seen = new Set();

    const addRelation = (groupKey, relatedMember, relationKey) => {
      if (!groupKey || !relatedMember || !relationKey) return;
      const relatedId = normalizeId(relatedMember?.sNo ?? relatedMember?.serNo);
      if (!relatedId || relatedId === currentId) return;
      const normalizedRelationKey = normalizeTextKey(relationKey);
      const dedupeKey = `${groupKey}-${relatedId}-${normalizedRelationKey}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const rule = relationLookup.get(normalizedRelationKey);
      const relationEnglish = rule?.english || relationKey;
      const relationMarathi = rule?.marathi || '';

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push({
        member: relatedMember,
        relationEnglish,
        relationMarathi
      });
    };

    const fatherId = normalizeId(member?.fatherSerNo);
    const motherId = normalizeId(member?.motherSerNo);
    const spouseId = normalizeId(member?.spouseSerNo);
    const selfGender = getGender(member);

    if (fatherId && membersById.has(fatherId)) {
      addRelation('Parents', membersById.get(fatherId), 'Father');
    }
    if (motherId && membersById.has(motherId)) {
      addRelation('Parents', membersById.get(motherId), 'Mother');
    }

    const children = [];
    membersArray.forEach((other) => {
      const otherId = normalizeId(other?.sNo ?? other?.serNo);
      if (!otherId || otherId === currentId) return;
      const otherFatherId = normalizeId(other?.fatherSerNo);
      const otherMotherId = normalizeId(other?.motherSerNo);
      if (otherFatherId === currentId || otherMotherId === currentId) {
        const childGender = getGender(other);
        const relationKey = childGender === 'female' ? 'Daughter' : 'Son';
        children.push(other);
        addRelation('Children', other, relationKey);
      }
    });

    const siblingsMap = new Map();
    membersArray.forEach((other) => {
      const otherId = normalizeId(other?.sNo ?? other?.serNo);
      if (!otherId || otherId === currentId) return;
      const shareFather = fatherId && normalizeId(other?.fatherSerNo) === fatherId;
      const shareMother = motherId && normalizeId(other?.motherSerNo) === motherId;
      if (shareFather || shareMother) {
        siblingsMap.set(otherId, other);
      }
    });
    const siblings = Array.from(siblingsMap.values());
    siblings.forEach((sibling) => {
      const siblingGender = getGender(sibling);
      const relationKey = siblingGender === 'female' ? 'Sister' : 'Brother';
      addRelation('Siblings', sibling, relationKey);
    });

    if (spouseId && membersById.has(spouseId)) {
      const spouse = membersById.get(spouseId);
      const spouseGender = getGender(spouse);
      const relationKey = spouseGender === 'female' ? 'Wife' : spouseGender === 'male' ? 'Husband' : 'Spouse';
      addRelation('Spouse', spouse, relationKey);
    } else {
      const marriedDetails = member?.marriedDetails || member?.marrieddetails || {};
      const spouseFullName = [
        marriedDetails.spouseFirstName,
        marriedDetails.spouseMiddleName,
        marriedDetails.spouseLastName
      ]
        .filter(Boolean)
        .join(' ')
        .trim()
        .toLowerCase();

      if (spouseFullName) {
        membersArray.forEach((candidate) => {
          const candidateName = buildFullName(candidate).toLowerCase();
          if (candidateName && candidateName === spouseFullName) {
            const candidateGender = getGender(candidate);
            const relationKey = candidateGender === 'female' ? 'Wife' : candidateGender === 'male' ? 'Husband' : 'Spouse';
            addRelation('Spouse', candidate, relationKey);
          }
        });
      }
    }

    const father = fatherId ? membersById.get(fatherId) : null;
    const mother = motherId ? membersById.get(motherId) : null;

    if (father) {
      const paternalGrandfatherId = normalizeId(father?.fatherSerNo);
      const paternalGrandmotherId = normalizeId(father?.motherSerNo);
      if (paternalGrandfatherId && membersById.has(paternalGrandfatherId)) {
        addRelation('Grandparents', membersById.get(paternalGrandfatherId), 'Grandfather (Paternal)');
      }
      if (paternalGrandmotherId && membersById.has(paternalGrandmotherId)) {
        addRelation('Grandparents', membersById.get(paternalGrandmotherId), 'Grandmother (Paternal)');
      }
    }

    if (mother) {
      const maternalGrandfatherId = normalizeId(mother?.fatherSerNo);
      const maternalGrandmotherId = normalizeId(mother?.motherSerNo);
      if (maternalGrandfatherId && membersById.has(maternalGrandfatherId)) {
        addRelation('Grandparents', membersById.get(maternalGrandfatherId), 'Grandfather (Maternal)');
      }
      if (maternalGrandmotherId && membersById.has(maternalGrandmotherId)) {
        addRelation('Grandparents', membersById.get(maternalGrandmotherId), 'Grandmother (Maternal)');
      }
    }

    children.forEach((child) => {
      const childId = normalizeId(child?.sNo ?? child?.serNo);
      if (!childId) return;
      membersArray.forEach((candidate) => {
        const candidateId = normalizeId(candidate?.sNo ?? candidate?.serNo);
        if (!candidateId || candidateId === currentId) return;
        const candidateFatherId = normalizeId(candidate?.fatherSerNo);
        const candidateMotherId = normalizeId(candidate?.motherSerNo);
        if (candidateFatherId === childId || candidateMotherId === childId) {
          const grandChildGender = getGender(candidate);
          const relationKey = grandChildGender === 'female' ? 'Granddaughter' : 'Grandson';
          addRelation('Grandchildren', candidate, relationKey);
        }
      });
    });

    const collectParentSide = (parent, side) => {
      if (!parent) return;
      const parentId = normalizeId(parent?.sNo ?? parent?.serNo);
      if (!parentId) return;
      const grandFatherId = normalizeId(parent?.fatherSerNo);
      const grandMotherId = normalizeId(parent?.motherSerNo);
      if (!grandFatherId && !grandMotherId) return;

      membersArray.forEach((relative) => {
        const relativeId = normalizeId(relative?.sNo ?? relative?.serNo);
        if (!relativeId || relativeId === parentId) return;
        const shareGrandFather = grandFatherId && normalizeId(relative?.fatherSerNo) === grandFatherId;
        const shareGrandMother = grandMotherId && normalizeId(relative?.motherSerNo) === grandMotherId;
        if (!shareGrandFather && !shareGrandMother) return;

        const relativeGender = getGender(relative);
        if (relativeGender === 'female') {
          addRelation('Uncles & Aunts', relative, side === 'paternal' ? "Aunt (Father's sister)" : "Aunt (Mother's sister)");
        } else {
          addRelation('Uncles & Aunts', relative, side === 'paternal' ? "Uncle (Father's brother)" : "Uncle (Mother's brother)");
        }

        const relativeSpouseId = normalizeId(relative?.spouseSerNo);
        if (relativeSpouseId && membersById.has(relativeSpouseId)) {
          const spouse = membersById.get(relativeSpouseId);
          if (relativeGender === 'female') {
            addRelation('Uncles & Aunts', spouse, side === 'paternal' ? "Uncle (Father's sister's husband)" : "Uncle (Mother's sister's husband)");
          } else {
            addRelation('Uncles & Aunts', spouse, side === 'paternal' ? "Aunt (Father's brother's wife)" : "Aunt (Mother's brother's wife)");
          }
        }

        const relativeChildren = membersArray.filter((candidate) => {
          const candidateFatherId = normalizeId(candidate?.fatherSerNo);
          const candidateMotherId = normalizeId(candidate?.motherSerNo);
          return candidateFatherId === relativeId || candidateMotherId === relativeId;
        });

        relativeChildren.forEach((cousin) => {
          const cousinGender = getGender(cousin);
          const relationKey = side === 'paternal'
            ? cousinGender === 'female' ? 'Cousin (Paternal, Female)' : 'Cousin (Paternal, Male)'
            : cousinGender === 'female' ? 'Cousin (Maternal, Female)' : 'Cousin (Maternal, Male)';
          addRelation('Cousins', cousin, relationKey);
        });
      });
    };

    collectParentSide(father, 'paternal');
    collectParentSide(mother, 'maternal');

    siblings.forEach((sibling) => {
      const siblingId = normalizeId(sibling?.sNo ?? sibling?.serNo);
      if (!siblingId) return;
      const siblingGender = getGender(sibling);
      membersArray.forEach((candidate) => {
        const candidateId = normalizeId(candidate?.sNo ?? candidate?.serNo);
        if (!candidateId || candidateId === currentId) return;
        const candidateFatherId = normalizeId(candidate?.fatherSerNo);
        const candidateMotherId = normalizeId(candidate?.motherSerNo);
        if (candidateFatherId === siblingId || candidateMotherId === siblingId) {
          const relationKey = siblingGender === 'female'
            ? getGender(candidate) === 'female' ? "Niece (Sister's daughter)" : "Nephew (Sister's son)"
            : getGender(candidate) === 'female' ? "Niece (Brother's daughter)" : "Nephew (Brother's son)";
          addRelation('Nieces & Nephews', candidate, relationKey);
        }
      });
    });

    if (spouseId && membersById.has(spouseId)) {
      const spouse = membersById.get(spouseId);
      const spouseGender = getGender(spouse);
      const spouseFatherId = normalizeId(spouse?.fatherSerNo);
      const spouseMotherId = normalizeId(spouse?.motherSerNo);

      if (spouseFatherId && membersById.has(spouseFatherId)) {
        addRelation('In-laws', membersById.get(spouseFatherId), 'Father-in-law');
      }
      if (spouseMotherId && membersById.has(spouseMotherId)) {
        addRelation('In-laws', membersById.get(spouseMotherId), 'Mother-in-law');
      }

      const spouseSiblingsMap = new Map();
      membersArray.forEach((candidate) => {
        const candidateId = normalizeId(candidate?.sNo ?? candidate?.serNo);
        if (!candidateId || candidateId === spouseId || candidateId === currentId) return;
        const candidateFatherId = normalizeId(candidate?.fatherSerNo);
        const candidateMotherId = normalizeId(candidate?.motherSerNo);
        const shareFather = spouseFatherId && candidateFatherId === spouseFatherId;
        const shareMother = spouseMotherId && candidateMotherId === spouseMotherId;
        if (shareFather || shareMother) {
          spouseSiblingsMap.set(candidateId, candidate);
        }
      });

      const relationPrefix = spouseGender === 'male' ? "husband's" : spouseGender === 'female' ? "wife's" : selfGender === 'female' ? "husband's" : "wife's";

      Array.from(spouseSiblingsMap.values()).forEach((relative) => {
        const relativeGender = getGender(relative);
        if (relativeGender === 'female') {
          const label = relationPrefix === "husband's" ? "Sister-in-law (husband's sister)" : "Sister-in-law (wife's sister)";
          addRelation('In-laws', relative, label);
        } else {
          const label = relationPrefix === "husband's" ? "Brother-in-law (husband's brother)" : "Brother-in-law (wife's brother)";
          addRelation('In-laws', relative, label);
        }
      });
    }

    ORDERED_GROUPS.forEach((groupKey) => {
      groups[groupKey].sort((a, b) => {
        if (a.relationEnglish !== b.relationEnglish) {
          return a.relationEnglish.localeCompare(b.relationEnglish);
        }
        const nameA = buildFullName(a.member);
        const nameB = buildFullName(b.member);
        return nameA.localeCompare(nameB);
      });
    });

    return ORDERED_GROUPS.map((key) => ({
      key,
      members: groups[key]
    })).filter((group) => group.members.length > 0);
  }, [member, allMembers, relationLookup]);
};

const MemberDetails = ({ member, allMembers, onBack, onViewDescendants }) => {
  const relationGroups = useRelations(member, allMembers);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf5] to-[#fff6ed] py-12 px-4 font-['Poppins','Nunito Sans',sans-serif] text-[#2b2b2b]">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:gap-12">
          <div className="relative">
            <div className="space-y-6 lg:sticky lg:top-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 rounded-full border border-[#f0e0d4] bg-[#fff8f3] px-3 py-2 text-xs font-medium text-[#b05a2b] shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out hover:bg-[#fff0e6] hover:text-[#a14f29]"
                >
                  <ArrowLeft className="h-4 w-4 text-[#b05a2b]" />
                  Back to Family Tree
                </button>
                <span className="text-xs text-[#a17c61]">
                  Vansh {member?.personalDetails?.vansh || member?.vansh || '—'} · Member {member?.sNo || member?.serNo || '—'}
                </span>
              </div>
              <ProfileCard member={member} />
            </div>
          </div>
          <div className="lg:border-l lg:border-[#f2e0d0]/70 lg:pl-8">
            <div className="flex gap-4 border-b border-[#f2e0d0]/70 mb-6">
              <span className="px-4 py-2 text-sm font-semibold border-b-2 border-[#f97316] text-[#f97316]">
                Family Relations
              </span>
            </div>

            <div className="mb-6">
              <button
                onClick={onViewDescendants}
                className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-[#ea580c]"
              >
                View Descendant Tree
              </button>
            </div>

            <RelationsPanel relationGroups={relationGroups} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;
export { useRelations };
