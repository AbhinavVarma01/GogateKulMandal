# Filtered Vansh Tree Component Guide

## Overview

The **FilteredVanshTree** component is a personalized family tree view that displays family members filtered by the logged-in user's vansh (family branch). It implements the Gogte lineage rule to maintain genealogical accuracy by excluding descendants of female members with non-Gogte surnames.

## Features

### 1. **Automatic User Detection**
- Decodes JWT token from localStorage (`authToken`)
- Extracts email from JWT payload
- Fetches corresponding member record from MongoDB `members` collection
- Retrieves the user's vansh value

### 2. **Vansh-Based Filtering**
- Fetches all members from the same vansh as the logged-in user
- Displays only members belonging to that specific vansh branch
- Shows hierarchical family structure within the vansh

### 3. **Gogte Lineage Rule**
The component applies a critical filtering rule:

**Rule:** If a female member's `personalDetails.lastName` is neither `"Gogte"` nor `"Gogate"`:
- ✓ The female member remains visible (maintains lineage link to parents)
- ✗ All her descendants (children, grandchildren, etc.) are removed from the tree

This ensures:
- Continuity for Gogte lineage
- Prevention of "external branch" expansion beyond the Gogte family

### 4. **Hierarchical Tree Construction**
- Uses `fatherSerNo` and `motherSerNo` fields to build parent-child relationships
- Creates a navigable, expandable tree structure
- Supports multiple root nodes (members with no parents in filtered set)

### 5. **User-Friendly Interface**
- Clean, card-based layout matching existing design
- Gender-coded colors (Blue for male, Pink for female)
- Expandable/collapsible nodes for navigation
- Hover tooltips with additional information (DOB, city, profession, email)
- User info banner showing filtered vansh context

## Data Structure

### Member Record Format
```javascript
{
  sNo: 1,                          // Serial number
  vansh: "51",                     // Family branch identifier
  fatherSerNo: null,               // Father's serial number
  motherSerNo: null,               // Mother's serial number
  personalDetails: {
    firstName: "Ballal",
    middleName: "Ganesh",
    lastName: "Gogte",             // Used for lineage rule
    gender: "male",
    dateOfBirth: { $date: {...} },
    email: "user@example.com",
    city: "Pune",
    profession: "Engineer"
  },
  marriedDetails: {
    spouseFirstName: "Name",
    spouseMiddleName: "Middle",
    spouseLastName: "Surname"
  }
}
```

### JWT Token Format
The token must contain:
- `sub`: Subject (user ID)
- `email`: User's email address (matched against members collection)
- `exp`: Expiration timestamp

## Component Location

- **File:** `frontend/src/FilteredVanshTree.jsx`
- **Styles:** Uses existing `CardFamilyTree.css` + additions
- **Integration:** Added to `/pages/FamilyTreePage.js` dropdown

## Usage

### Access the Component
1. Navigate to the Family Tree page (`/kulavruksh`)
2. Select **"Filtered Vansh Tree (NEW)"** from the dropdown menu
3. The component automatically:
   - Detects your login
   - Fetches your profile
   - Loads your vansh family tree
   - Applies lineage rules

### User Experience Flow

1. **Authentication Check**
   - Validates JWT token exists
   - If not → redirects to login

2. **User Profile Lookup**
   - Queries members collection by email
   - If not found → displays error, prompts contact with admin

3. **Vansh Assignment Check**
   - Verifies user has a vansh value
   - If not → displays error message

4. **Data Fetching**
   - Fetches all members
   - Filters by matching vansh
   - Returns loading spinner while processing

5. **Tree Building**
   - Applies Gogte lineage rule
   - Constructs parent-child relationships
   - Renders interactive tree

## Error Handling

### Possible Error States

| Scenario | Message | Action |
|----------|---------|--------|
| No token | "Invalid or expired authentication" | Redirect to login after 2 seconds |
| Invalid token | "Invalid or expired authentication" | Redirect to login after 2 seconds |
| No matching user | "User not found in members collection" | Shows error, suggest checking profile |
| No vansh assigned | "Your profile does not have a vansh assigned" | Shows error, contact admin |
| No members in vansh | "No members found for your vansh" | Shows error message |
| Empty filtered tree | "No valid family tree data after filtering" | Shows error message |

## Backend API Requirements

### Endpoint: `/api/family/members`
**Method:** GET  
**Authentication:** Bearer token (optional for this endpoint)

**Response:**
```javascript
{
  "members": [
    {
      "sNo": 1,
      "vansh": "51",
      "personalDetails": { ... },
      "fatherSerNo": null,
      "motherSerNo": null,
      ...
    }
  ]
}
```

## Implementation Details

### Key Functions

#### 1. `decodeToken()`
Extracts JWT payload from localStorage token

#### 2. `fetchUserMemberRecord(decodedToken)`
Finds matching member by email in members collection

#### 3. `applyGogteLineageRule(members, memberMap)`
Filters descendants of non-Gogte females:
- Identifies non-Gogte females: `lastName !== "Gogte" AND lastName !== "Gogate" AND gender === "female"`
- Recursively removes all descendants
- Keeps the female member herself visible

#### 4. `buildHierarchicalTree(members, filteredSet)`
Constructs tree structure:
- Maps members for quick lookup
- Builds parent-child relationships via serNo
- Identifies root nodes (no parents in filtered set)
- Returns array of tree nodes

#### 5. `buildTreeNode(member, memberMap)`
Recursively creates tree node with:
- Full name (firstName + middleName + lastName)
- Gender-based styling
- Spouse information
- Profession, DOB, city, email
- Child nodes

### Tree Node Structure

```javascript
{
  name: "Full Name",
  attributes: {
    serNo: 1,
    gender: "male",
    vansh: "51",
    spouse: "Spouse Name",
    profession: "Engineer",
    dob: "1970-01-01",
    city: "Pune",
    email: "user@example.com"
  },
  children: [ /* array of child nodes */ ]
}
```

## Styling

### CSS Classes
- `.card-tree-node` - Individual member card
- `.card-tree-node.male` - Male member (blue left border)
- `.card-tree-node.female` - Female member (pink left border)
- `.card-tree-children` - Container for child nodes
- `.card-node-name` - Clickable member name (links to profile)
- `.card-node-detail` - Member details (spouse, vansh, profession)

### Responsive Design
- Mobile: Smaller fonts, adjusted spacing
- Desktop: Full-size cards with hover effects
- Expandable nodes: Show/hide children via chevron buttons

## Features Roadmap

### Phase 1 (Current)
- ✓ Automatic user detection
- ✓ Vansh filtering
- ✓ Gogte lineage rule
- ✓ Hierarchical tree display
- ✓ Basic styling

### Phase 2 (Future Enhancements)
- [ ] Zoom and pan controls (using react-zoom-pan-pinch)
- [ ] PDF export functionality
- [ ] Advanced tooltips with relationship indicators
- [ ] Search/filter within tree
- [ ] Breadcrumb navigation
- [ ] Side-by-side comparison of different vansh trees

### Phase 3 (Advanced)
- [ ] Dynamic tree layout options (horizontal, vertical, radial)
- [ ] Ancestor/descendant path highlighting
- [ ] Relationship calculator
- [ ] Photo gallery integration
- [ ] Timeline view

## Testing Checklist

- [ ] Authentication: Valid JWT token decoding
- [ ] User lookup: Correct member found by email
- [ ] Vansh filtering: Only vansh members displayed
- [ ] Lineage rule: Non-Gogte female descendants excluded
- [ ] Tree building: Correct parent-child relationships
- [ ] UI rendering: Cards display correctly
- [ ] Expandable nodes: Collapse/expand works
- [ ] Hover tooltips: Additional info visible
- [ ] Links: Member names link to profiles
- [ ] Error handling: All error states show appropriate messages
- [ ] Mobile responsiveness: Displays correctly on small screens
- [ ] Performance: Tree loads quickly (test with 1000+ members)

## Troubleshooting

### Issue: "User not found in members collection"
**Solution:** Ensure the logged-in user's email matches exactly with a member's `personalDetails.email` field

### Issue: "No members found for your vansh"
**Solution:** Check database to confirm other members have the same vansh value assigned

### Issue: Tree shows empty despite vansh match
**Solution:** Verify that after applying Gogte lineage rule, there are members remaining. Check for non-Gogte females blocking entire branches

### Issue: Members showing incorrect relationships
**Solution:** Validate `fatherSerNo` and `motherSerNo` values are correct in database

### Issue: Performance is slow with large vansh
**Solution:** Optimize by:
- Adding database indexes on `vansh` field
- Implementing pagination
- Using React.memo for tree nodes

## Migration from Old System

If migrating users from an old member tracking system:

1. Ensure all members have `sNo`/`serNo` values
2. Assign `vansh` values to all members
3. Populate `fatherSerNo` and `motherSerNo` for relationships
4. Verify `personalDetails.lastName` contains Gogte/Gogate/other surnames
5. Update login collection to link to member records via email

## API Security

The component uses:
- JWT bearer token authentication (via interceptor in `utils/api.js`)
- Token expiration (typically 7 days)
- Automatic logout on 401 error
- No sensitive data exposed in frontend

## License & Support

This component is part of the GogteKulavrutta family management system.

For issues or feature requests, contact the development team.

---

**Component Version:** 1.0  
**Last Updated:** 2024  
**Compatibility:** React 18+, ES6+