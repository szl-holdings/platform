# Visual Regression Testing Plan

## Current State
No visual regression testing in place. Design consistency is maintained via:
- Shared UI component library
- Consistent Tailwind CSS theme
- Design token documentation
- Code review via CODEOWNERS

## Proposed Plan

### Phase 1: Screenshot Catalog (Month 1)
- Capture baseline screenshots of all key pages
- Organize by product and component
- Store in version control

### Phase 2: Storybook Setup (Month 2)
- Install Storybook with React + Vite builder
- Create stories for core components
- Document component states

### Phase 3: Automated Comparison (Month 3)
- Integrate visual regression tool (Chromatic, Percy, or open-source)
- Add to CI pipeline
- Set acceptable diff threshold
- Review workflow for visual changes

### Phase 4: Continuous (Ongoing)
- Every new component gets stories
- Every PR with UI changes gets visual review
- Monthly review of visual regression results

## Components to Prioritize for Stories
1. Dashboard shells (each product)
2. Data tables (the most used component)
3. Detail pages (entity profiles)
4. Forms (create/edit modals)
5. Navigation (sidebar, header)
6. Charts (area, bar, line)
7. Maps (fleet, property)
8. Status chips and badges
