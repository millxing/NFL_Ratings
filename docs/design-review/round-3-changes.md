# Round 3 changes and verification

Read round-2-opus.md and round-2-astra.md for the running issue register. All previous IDs must retain a disposition in final reviews.

Implemented candidates:
- O-06/O-18/A-11: a viewport-pinned header mirrors column widths and horizontal scroll while the original header is above the viewport. Sort controls remain operable. It hides outside the ratings table.
- O-08/O-20: live status explicitly names the adjusted end week. Invalid earlier end weeks remain disabled.
- O-19/O-21: clearing status removes stale text and modifiers; stale selection has its own state. Restored results hide initial loaded-data feedback.
- O-22: Rank and Team both stay visible during horizontal scrolling. Mobile matchup uses a semantic metric-by-team table with no horizontal scrolling.
- O-23: both movement columns sort; missing movement stays last. Regions have specific names without unnecessary scrolling instructions.

Parent regression checks before review:
- Existing node model suite passes after final changes.
- 2025 weeks 1–18 produces 32 rows / 272 games.
- Adjustment 10→12 announces “End week moved to 12 to match start week.”
- Completed status has empty text.
- Both movement sorts return correct descending sequences; rank sorting restored.
- Actual Enter on floating Rating button reverses sort to ascending, -12.4 first.
- Floating headers align at 0px difference in all ten columns, desktop and 390px mobile after 250px horizontal / 800px vertical scroll.
- Sticky Rank right edge and Team left edge both at x=89 on mobile; no overlap.
- Mobile comparison shows both teams, rank, rating, record, movement, differential, SOS in three semantic columns, with no horizontal overflow.
- Replaced existing CSS rules in place; retained a single style block and consolidated responsive rules. No appended round-specific override stylesheet.

Current review URL: http://localhost:8765/NFLPowerRatings-v3.html?review=3final
