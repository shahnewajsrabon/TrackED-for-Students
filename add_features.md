## Implementation Plan for TrackEd Enhancements

You requested to implement **all** the suggested features: Real-time Study Rooms, SRS Flashcards, Daily Quests, and Detailed Subject Analytics. This is a large undertaking, so I will break this down into phases. I will start by implementing **Phase 1: Spaced Repetition System (SRS) for Flashcards** to provide immediate, high-value impact.

### Phase 1 Plan: Spaced Repetition System (SRS) for Flashcards
1.  **Update Data Model:** Update `Flashcard` interface in `src/types/index.ts` to include SRS fields: `nextReviewDate` (ISO string), `interval` (number), `easeFactor` (number), `repetitions` (number).
2.  **Update Firestore Rules:** (Already allow update/write for decks, so no change needed).
3.  **Implement SuperMemo-2 Algorithm:** Create a new file `src/lib/srs.ts` to handle the SM-2 algorithm logic to calculate the next review date based on user feedback (Easy, Good, Hard, Again).
4.  **Update `FlashcardsPage.tsx` and `StudyModeDisplay.tsx`:**
    *   Filter cards in "Study Mode" to only show cards where `nextReviewDate` is in the past (or null/undefined).
    *   When an answer is revealed, replace the "Next" button with SM-2 feedback buttons (Again, Hard, Good, Easy).
    *   When a feedback button is clicked, calculate the new SRS values using `srs.ts`, update the card in the local `activeDeck` state, and save the updated deck to Firestore.
    *   Show a message when all due cards are reviewed.
5.  **Dashboard Integration:** Add a "Due for Review" section to the Dashboard to remind users to review their flashcards.
