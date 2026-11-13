# Overtime PDF export hotfix

This update adds an **Export overtime logs** action to the **Shifts** screen, with no changes to the current V11.5 animation, data storage, navigation, or signing setup.

## Report contents
- Uses the active salary-cycle boundaries already shown by the app.
- Uses the existing `calc(e,e.out)` routine (the same overtime rules used for in-app totals).
- Includes **completed**, saved shifts only. No clock-out means the entry is excluded until completed.
- Two sections: OT 1.5 and OT 2.0. A split shift can appear in both, with its respective hours.
- Per row: recorded date, actual clock-in, actual clock-out, and computed overtime hours.
- Each section ends with its total. No salary numbers, signatures, or explanatory page.
- Handles longer cycles with automatic page breaks and repeated column headers.

## Operation and data integrity
- Button uses local PDF generation in JavaScript, with no network or third-party PDF library.
- On Android, writes the PDF to Capacitor Filesystem cache, then opens Android's Share dialog through Capacitor Share. In a web browser, downloads the same PDF.
- Demo Mode cannot export test data; user must turn demo off. Does not mutate `log`, `v4ui`, or other existing persisted data.
- VersionCode is incremented automatically by the existing Android CI workflow; applicationId and update signature are unchanged.

## Tests
- JavaScript syntax check with Node.
- Valid PDF parsed using pypdf for OT 1.5, OT 2.0, incomplete shift filtering and total aggregation.
- A 5-page output with 85 test entries successfully parsed, with all 85 rows present.
- Final on-device Share dialog and rendering still require confirmation on the Samsung Galaxy A06.
