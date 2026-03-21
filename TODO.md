# Labour Dropdown Implementation TODO

## Plan Progress
- [x] Analyzed files and confirmed API endpoint
- [x] Got user approval for plan

## Implementation Steps
- [ ] 1. Update src/app/supervisor/supervisor_myprojects.tsx
  - Add labourOptions state
  - Add fetchLabourOptions function  
  - Add selectedLabourId state
  - Pass new props to ExpenseModal
- [ ] 2. Update src/components/supervisor-modal/ExpenseModal.tsx
  - Add new interface props
  - Replace name input with dropdown for labour
  - Add fetch logic and auto-set title
- [ ] 3. Test dropdown loads data
- [ ] 4. Test expense save with selected labour
