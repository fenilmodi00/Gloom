# Draft: Refactor Trending Components
## Requirements (confirmed)
- [requirement]: Refactor TrendingGrid and InspoBottomSheet to use a config file instead of mock data
- [requirement]: Config file should be in Jane protocol format for remote updates
- [requirement]: Show full picture of card on click
- [requirement]: Show items on swipe using model carousel component

## Technical Decisions
- [decision]: Use a JSON config file approach for dynamic data loading
- [decision]: Implement loading and error handling for remote config

## Research Findings
- [source]: TrendingGrid.tsx - uses mock data currently
- [source]: InspoBottomSheet.tsx - uses TrendingGrid for display

## Open Questions
- [question]: What is the exact format of the Jane protocol for config files?
- [question]: How will the model carousel component be implemented for item display?
- [question]: What are the hosting details for the config file (hub)?

## Scope Boundaries
- INCLUDE: Refactor components to use config file
- INCLUDE: Implement loading state
- INCLUDE: Implement error handling
- EXCLUDE: Manual data entry for each item