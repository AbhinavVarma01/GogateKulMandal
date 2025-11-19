// CommonJS module: relationship engine for dynamic relations

function toInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function buildMembersIndex(members) {
  const byId = new Map();
  for (const m of members || []) {
    const key = toInt(m && m.serNo);
    if (key !== null) {
      byId.set(key, m);
    }
  }
  return byId;
}

function buildRelationRulesMap(relationRules) {
  const map = new Map();
  for (const rule of relationRules || []) {
    if (rule.relationEnglish) {
      map.set(rule.relationEnglish, {
        marathi: rule.relationMarathi || '',
        reverseEnglish: rule.reverseEnglish || '',
        reverseMarathi: rule.reverseMarathi || ''
      });
    }
  }
  return map;
}

function getId(person, key) {
  return toInt(person && person[key]);
}

function getChildren(person, membersById) {
  const ids = (person && person.childrenSerNos) || [];
  const normIds = ids.map(toInt).filter((x) => x !== null);
  return normIds.map((id) => membersById.get(id)).filter(Boolean);
}

function getParents(person, membersById) {
  const out = [];
  const fId = getId(person, 'fatherSerNo');
  const mId = getId(person, 'motherSerNo');
  if (membersById.has(fId)) out.push(membersById.get(fId));
  if (membersById.has(mId)) out.push(membersById.get(mId));
  return out;
}

function getSiblings(person, membersById) {
  const siblings = [];
  const meId = toInt(person && person.serNo);
  for (const parent of getParents(person, membersById)) {
    const childIds = (parent && parent.childrenSerNos ? parent.childrenSerNos : []).map(toInt);
    for (const cid of childIds) {
      if (cid !== null && cid !== meId && membersById.has(cid)) {
        siblings.push(membersById.get(cid));
      }
    }
  }
  return siblings;
}

function relationshipLogic(person, membersById, relationRulesMap = new Map()) {
  const relations = [];
  const seen = new Set(); // dedupe by "relationType::id"
  const myId = toInt(person && person.serNo);

  function addRelation(relType, related) {
    const id = toInt(related && related.serNo);
    if (id === null || id === myId) return;
    const key = `${relType}::${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      const ruleInfo = relationRulesMap.get(relType) || {};
      relations.push({ 
        relationEnglish: relType, 
        relationMarathi: ruleInfo.marathi || '',
        related 
      });
    }
  }

  const fId = getId(person, 'fatherSerNo');
  const mId = getId(person, 'motherSerNo');

  // Father / Mother
  if (membersById.has(fId)) addRelation('Father', membersById.get(fId));
  if (membersById.has(mId)) addRelation('Mother', membersById.get(mId));

  // Children
  for (const child of getChildren(person, membersById)) {
    if ((child && child.gender) === 'Male') addRelation('Son', child);
    else addRelation('Daughter', child);
  }

  // Siblings
  for (const sib of getSiblings(person, membersById)) {
    if ((sib && sib.gender) === 'Male') addRelation('Brother', sib);
    else addRelation('Sister', sib);
  }

  // Spouse
  const sId = getId(person, 'spouseSerNo');
  if (membersById.has(sId)) {
    const spouse = membersById.get(sId);
    if ((spouse && spouse.gender) === 'Male') addRelation('Husband', spouse);
    else addRelation('Wife', spouse);
  }

  // Grandparents
  if (membersById.has(fId)) {
    const father = membersById.get(fId);
    const ffId = getId(father, 'fatherSerNo');
    const fmId = getId(father, 'motherSerNo');
    if (membersById.has(ffId)) addRelation('Grandfather (Paternal)', membersById.get(ffId));
    if (membersById.has(fmId)) addRelation('Grandmother (Paternal)', membersById.get(fmId));
  }
  if (membersById.has(mId)) {
    const mother = membersById.get(mId);
    const mfId = getId(mother, 'fatherSerNo');
    const mmId = getId(mother, 'motherSerNo');
    if (membersById.has(mfId)) addRelation('Grandfather (Maternal)', membersById.get(mfId));
    if (membersById.has(mmId)) addRelation('Grandmother (Maternal)', membersById.get(mmId));
  }

  // Grandchildren
  for (const child of getChildren(person, membersById)) {
    for (const grandchild of getChildren(child, membersById)) {
      if ((grandchild && grandchild.gender) === 'Male') {
        addRelation('Grandson', grandchild);
      } else {
        addRelation('Granddaughter', grandchild);
      }
    }
  }

  // Uncles/Aunts & Cousins
  for (const tuple of [['fatherSerNo', true], ['motherSerNo', false]]) {
    const parentKey = tuple[0];
    const paternal = tuple[1];
    const pId = getId(person, parentKey);
    if (!membersById.has(pId)) continue;

    const parent = membersById.get(pId);
    // Mirrors Python: uses parent's fatherSerNo to enumerate uncles/aunts
    const gpId = getId(parent, 'fatherSerNo');
    if (!membersById.has(gpId)) continue;

    const grandparent = membersById.get(gpId);
    const gpChildren = (grandparent && grandparent.childrenSerNos ? grandparent.childrenSerNos : []).map(toInt);

    for (const cid of gpChildren) {
      if (cid === null || cid === pId || !membersById.has(cid)) continue;

      const relative = membersById.get(cid);
      const rGender = relative && relative.gender;

      if (rGender === 'Male') {
        addRelation(paternal ? 'Uncle (Father’s brother)' : 'Uncle (Mother’s brother)', relative);

        const rSp = getId(relative, 'spouseSerNo');
        if (membersById.has(rSp)) {
          addRelation(
            paternal ? 'Aunt (Father’s brother’s wife)' : 'Aunt (Mother’s brother’s wife)',
            membersById.get(rSp)
          );
        }
      } else {
        addRelation(paternal ? 'Aunt (Father’s sister)' : 'Aunt (Mother’s sister)', relative);

        const rSp = getId(relative, 'spouseSerNo');
        if (membersById.has(rSp)) {
          addRelation(
            paternal ? 'Uncle (Father’s sister’s husband)' : 'Uncle (Mother’s sister’s husband)',
            membersById.get(rSp)
          );
        }
      }

      // Cousins (children of those uncles/aunts)
      for (const c of getChildren(relative, membersById)) {
        const label =
          paternal
            ? ((c && c.gender) === 'Male' ? 'Cousin (Paternal, Male)' : 'Cousin (Paternal, Female)')
            : ((c && c.gender) === 'Male' ? 'Cousin (Maternal, Male)' : 'Cousin (Maternal, Female)');
        addRelation(label, c);
      }
    }
  }

  // Nephews/Nieces
  for (const sib of getSiblings(person, membersById)) {
    for (const c of getChildren(sib, membersById)) {
      if ((sib && sib.gender) === 'Male') {
        addRelation(((c && c.gender) === 'Male') ? 'Nephew (Brother’s son)' : 'Niece (Brother’s daughter)', c);
      } else {
        addRelation(((c && c.gender) === 'Male') ? 'Nephew (Sister’s son)' : 'Niece (Sister’s daughter)', c);
      }
    }
  }

  // In-laws
  if (membersById.has(sId)) {
    const spouse = membersById.get(sId);
    const sfId = getId(spouse, 'fatherSerNo');
    const smId = getId(spouse, 'motherSerNo');

    if (membersById.has(sfId)) addRelation('Father-in-law', membersById.get(sfId));
    if (membersById.has(smId)) addRelation('Mother-in-law', membersById.get(smId));

    for (const sib of getSiblings(spouse, membersById)) {
      if ((sib && sib.gender) === 'Male') {
        addRelation(
          (person && person.gender) === 'Female' ? 'Brother-in-law (wife’s brother)' : 'Brother-in-law (husband’s brother)',
          sib
        );
      } else {
        addRelation(
          (person && person.gender) === 'Male' ? 'Sister-in-law (wife’s sister)' : 'Sister-in-law (husband’s sister)',
          sib
        );
      }
    }
  }

  return relations;
}

function getRelationsForSerNo(serNo, membersById, relationRulesMap = new Map()) {
  const id = toInt(serNo);
  if (!membersById.has(id)) return [];

  const person = membersById.get(id);
  return relationshipLogic(person, membersById, relationRulesMap);
}

module.exports = {
  toInt,
  buildMembersIndex,
  buildRelationRulesMap,
  relationshipLogic,
  getRelationsForSerNo,
};