/**
 * Utility functions to transform member data between nested and flat schemas
 */

/**
 * Transform nested member data to flat schema for tree components
 * Handles both old flat schema and new nested schema with personalDetails
 */
export function transformMemberForTree(member) {
  try {
    if (!member) return null;

    const personal = member.personalDetails || {};
    
    // Extract names
    const firstName = personal.firstName || member.firstName || '';
    const middleName = personal.middleName || member.middleName || '';
    const lastName = personal.lastName || member.lastName || '';
    const fullName = member.name || member.fullName || 
      `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();

    // Extract image
    const profileImageData = personal.profileImage?.data || member.profileImage?.data || member.profileImage;
    
    // Extract status
    const isAlive = personal.isAlive === 'yes' || personal.isAlive === true || member.isAlive === true;
    const status = isAlive ? 'alive' : 'deceased';

    // Extract date of birth - handle MongoDB Extended JSON format
    const dob = personal.dateOfBirth || member.dateOfBirth || member.dob;
    let dobString = null;
    if (dob) {
      try {
        if (typeof dob === 'object') {
          // Handle MongoDB Extended JSON format: {$date: {$numberLong: "..."}} or {$date: "..."}
          if (dob.$date) {
            let timestamp;
            if (typeof dob.$date === 'object' && dob.$date.$numberLong) {
              // MongoDB Extended JSON with $numberLong
              timestamp = parseInt(dob.$date.$numberLong);
            } else if (typeof dob.$date === 'string') {
              // MongoDB Extended JSON with string date
              timestamp = new Date(dob.$date).getTime();
            } else if (typeof dob.$date === 'number') {
              // Direct timestamp
              timestamp = dob.$date;
            } else {
              timestamp = null;
            }
            if (timestamp) {
              dobString = new Date(timestamp).toISOString().split('T')[0];
            }
          } else if (dob instanceof Date) {
            dobString = dob.toISOString().split('T')[0];
          }
        } else if (typeof dob === 'string') {
          dobString = dob;
        } else if (typeof dob === 'number') {
          dobString = new Date(dob).toISOString().split('T')[0];
        }
      } catch (err) {
        console.warn('Error parsing date of birth:', err.message);
        dobString = null;
      }
    }

    // Extract marriage details for spouse info
    const married = member.marriedDetails || {};
    const spouseFirstName = married.spouseFirstName || '';
    const spouseMiddleName = married.spouseMiddleName || '';
    const spouseLastName = married.spouseLastName || '';
    const spouseName = `${spouseFirstName} ${spouseMiddleName} ${spouseLastName}`.replace(/\s+/g, ' ').trim();
    const spouseEmail = married.spouseEmail || '';
    const spouseMobileNumber = married.spouseMobileNumber || '';

    // Ensure serNo is a number
    const serNo = member.serNo || member.sNo;
    const serNoNum = typeof serNo === 'string' ? parseInt(serNo, 10) : serNo;

    return {
      // Identifiers
      _id: member._id,
      sNo: serNoNum,
      serNo: serNoNum,
      
      // Names
      firstName,
      middleName,
      lastName,
      fullName,
      name: fullName,
      
      // Personal Details
      gender: personal.gender || member.gender,
      dateOfBirth: dobString,
      dob: dobString,
      profileImage: profileImageData,
      email: personal.email || member.email,
      mobileNumber: personal.mobileNumber || member.mobileNumber,
      
      // Location
      country: personal.country || member.country,
      state: personal.state || member.state,
      city: personal.city || member.city,
      pinCode: personal.pinCode || member.pinCode,
      
      // Spouse Information (extracted from marriedDetails)
      spouseInfo: spouseName ? {
        firstName: spouseFirstName,
        middleName: spouseMiddleName,
        lastName: spouseLastName,
        fullName: spouseName,
        email: spouseEmail,
        mobileNumber: spouseMobileNumber,
        dateOfMarriage: married.dateOfMarriage,
        description: married.description || ''
      } : null,
      
      // Family Tree Relations - ensure numbers
      fatherSerNo: member.fatherSerNo ? (typeof member.fatherSerNo === 'string' ? parseInt(member.fatherSerNo, 10) : member.fatherSerNo) : null,
      motherSerNo: member.motherSerNo ? (typeof member.motherSerNo === 'string' ? parseInt(member.motherSerNo, 10) : member.motherSerNo) : null,
      spouseSerNo: member.spouseSerNo ? (typeof member.spouseSerNo === 'string' ? parseInt(member.spouseSerNo, 10) : member.spouseSerNo) : null,
      childrenSerNos: Array.isArray(member.childrenSerNos) 
        ? member.childrenSerNos.map(c => typeof c === 'string' ? parseInt(c, 10) : c)
        : (Array.isArray(member.sonDaughterSerNo) ? member.sonDaughterSerNo.map(c => typeof c === 'string' ? parseInt(c, 10) : c) : []),
      sonDaughterSerNo: Array.isArray(member.sonDaughterSerNo)
        ? member.sonDaughterSerNo.map(c => typeof c === 'string' ? parseInt(c, 10) : c)
        : (Array.isArray(member.childrenSerNos) ? member.childrenSerNos.map(c => typeof c === 'string' ? parseInt(c, 10) : c) : []),
      sonDaughterCount: (Array.isArray(member.childrenSerNos) ? member.childrenSerNos.length : (Array.isArray(member.sonDaughterSerNo) ? member.sonDaughterSerNo.length : 0)),
      
      // Hierarchy
      level: member.level !== undefined ? member.level : null,
      vansh: member.vansh || personal.vansh || '',
      
      // Approval status
      isapproved: member.isapproved !== false,
      
      // Status
      status,
      isAlive,
      
      // Keep original data for reference
      _original: member
    };
  } catch (error) {
    console.error('Error transforming member for tree:', error);
    return null;
  }
}

/**
 * Transform array of members
 */
export function transformMembersForTree(members) {
  try {
    if (!Array.isArray(members)) return [];
    return members.map(transformMemberForTree).filter(m => m !== null);
  } catch (error) {
    console.error('Error transforming members list for tree:', error);
    return [];
  }
}

/**
 * Build hierarchical tree structure from flat member list
 */
export function buildTreeStructure(members, rootSerNo = null) {
  try {
    if (!Array.isArray(members) || members.length === 0) return null;

    // Create a map for quick lookup
    const memberMap = new Map();
    members.forEach(member => {
      memberMap.set(member.serNo, member);
    });

    // Find root member (one with no father or specified rootSerNo)
    let rootMember = null;
    if (rootSerNo) {
      rootMember = memberMap.get(rootSerNo);
    } else {
      // Priority: Find root with no father (level 0) first
      rootMember = members.find(m => !m.fatherSerNo && m.level === 0);
      // If not found, try any member with no father
      if (!rootMember) {
        rootMember = members.find(m => !m.fatherSerNo);
      }
      // If still not found, try any member with level 1
      if (!rootMember) {
        rootMember = members.find(m => m.level === 1);
      }
    }

    if (!rootMember) {
      rootMember = members[0]; // Fallback to first member
    }

    // Track processed members to prevent duplicates
    const processed = new Set();

    /**
     * Recursively build tree nodes
     */
    function buildNode(member) {
      // Skip if member already processed (prevents duplicates)
      if (!member || processed.has(member.serNo)) {
        return null;
      }
      processed.add(member.serNo);

      const children = [];

      // Add spouse (either via spouseSerNo link or spouseInfo from marriedDetails)
      if (member.spouseSerNo) {
        // If spouse link exists, add spouse record
        const spouse = memberMap.get(member.spouseSerNo);
        if (spouse && !processed.has(spouse.serNo)) {
          processed.add(spouse.serNo);
          children.push({
            ...spouse,
            relationToParent: 'spouse'
          });
        }
      } else if (member.spouseInfo && member.spouseInfo.fullName) {
        // If spouse info exists but not linked by serNo, add spouse as virtual node
        children.push({
          _id: null,
          serNo: null,
          firstName: member.spouseInfo.firstName,
          middleName: member.spouseInfo.middleName,
          lastName: member.spouseInfo.lastName,
          fullName: member.spouseInfo.fullName,
          name: member.spouseInfo.fullName,
          email: member.spouseInfo.email,
          mobileNumber: member.spouseInfo.mobileNumber,
          gender: null,
          dateOfBirth: null,
          profileImage: null,
          status: 'spouse',
          relationToParent: 'spouse',
          description: member.spouseInfo.description,
          dateOfMarriage: member.spouseInfo.dateOfMarriage,
          children: [] // Spouses have no direct children in tree structure
        });
      }

      // Add children
      if (member.childrenSerNos && Array.isArray(member.childrenSerNos)) {
        member.childrenSerNos.forEach(childSerNo => {
          if (!processed.has(childSerNo)) {
            const child = memberMap.get(childSerNo);
            if (child) {
              const childNode = buildNode(child);
              if (childNode) {
                children.push(childNode);
              }
            }
          }
        });
      }

      return {
        ...member,
        children
      };
    }

    return buildNode(rootMember);
  } catch (error) {
    console.error('Error building tree structure:', error);
    return null;
  }
}

/**
 * Get members grouped by level
 */
export function getMembersByLevel(members) {
  try {
    if (!Array.isArray(members)) return {};

    const grouped = {};
    members.forEach(member => {
      const level = member.level !== undefined ? member.level : 'unknown';
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(member);
    });

    return grouped;
  } catch (error) {
    console.error('Error grouping members by level:', error);
    return {};
  }
}

/**
 * Extract relationship information between two members
 */
export function getRelationshipBetween(member1, member2, allMembers) {
  try {
    if (!member1 || !member2) return null;

    const memberMap = new Map();
    (allMembers || []).forEach(m => memberMap.set(m.serNo, m));

    // Direct relationships
    if (member1.spouseSerNo === member2.serNo) return 'Spouse';
    if (member2.spouseSerNo === member1.serNo) return 'Spouse';
    
    if (member1.fatherSerNo === member2.serNo) return 'Father';
    if (member1.motherSerNo === member2.serNo) return 'Mother';
    if (member2.fatherSerNo === member1.serNo) return 'Child';
    
    if (member1.childrenSerNos?.includes(member2.serNo)) return 'Child';
    if (member2.childrenSerNos?.includes(member1.serNo)) return 'Parent';

    // Siblings
    if (member1.fatherSerNo && member1.fatherSerNo === member2.fatherSerNo) {
      return 'Sibling';
    }

    // Grandparent-Grandchild
    const m1Father = memberMap.get(member1.fatherSerNo);
    const m2Father = memberMap.get(member2.fatherSerNo);
    
    if (m1Father?.fatherSerNo === member2.serNo) return 'Grandfather';
    if (m2Father?.fatherSerNo === member1.serNo) return 'Grandson/Granddaughter';

    return null;
  } catch (error) {
    console.error('Error determining relationship between members:', error);
    return null;
  }
}

export default {
  transformMemberForTree,
  transformMembersForTree,
  buildTreeStructure,
  getMembersByLevel,
  getRelationshipBetween
};
