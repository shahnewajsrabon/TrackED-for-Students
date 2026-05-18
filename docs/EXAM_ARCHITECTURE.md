# TrackEd Exam & Ranking System Architecture

## 1. Database Schema (NoSQL - Firestore)

We use Firestore optimized for fast reads and scalable real-time leaderboards.

### `exams` Collection
Stores exam metadata, configuration, and security rules.
```json
{
  "id": "exam_123",
  "creator_id": "user_456",
  "title": "Physics Midterm Simulation",
  "type": "MCQ", // or "Written"
  "subject_id": "subj_001",
  "duration_mins": 60,
  "total_marks": 50,
  "negative_marking": 0.25,
  "status": "active", // active, completed, draft
  "share_code": "PHY-2024-X1", // Unique short code (Indexed)
  "created_at": "timestamp",
  "expires_at": "timestamp"
}
```

### `exam_questions` (Subcollection under `exams/{exam_id}`)
Separated to prevent loading all questions when just fetching the exam list.
```json
{
  "id": "q_001",
  "question_text": "What is the unit of force?",
  "options": ["Newton", "Joule", "Watt", "Pascal"],
  "correct_option_index": 0, // Hidden from client payload until submission
  "marks": 1
}
```

### `exam_participants` Collection
Tracks active participants, their submissions, and scores.
```json
{
  "id": "part_789",
  "exam_id": "exam_123", // Indexed
  "user_id": "user_999", // Indexed
  "joined_at": "timestamp",
  "submitted_at": "timestamp",
  "time_taken_seconds": 3450,
  "total_score": 42.5,
  "status": "completed", // ongoing, completed
  "responses": {
    "q_001": 0,
    "q_002": 2
  }
}
```

---

## 2. API Architecture (Serverless Functions / API Routes)

### `POST /api/exams/create`
Validates payload and creates the exam + questions in a batched write.
- **Security**: Validates user session.
- **Logic**: Generates a cryptographically strong, collision-resistant 6-8 character share code.

### `POST /api/exams/join`
- **Payload**: `{ "share_code": "PHY-2024-X1" }`
- **Logic**: 
  1. Look up exam by `share_code`.
  2. Check if `expires_at` is passed.
  3. Create an `exam_participants` record with `status: ongoing`.
  4. Return exam metadata and questions (without `correct_option_index`).

### `POST /api/exams/submit`
- **Payload**: `{ "exam_id": "...", "responses": { "q_001": 0, ... } }`
- **Logic**:
  1. Fetch actual answers and calculate the score server-side.
  2. Late Submission Handling: If `time_taken_seconds > duration_mins * 60 + grace_period`, either reject or apply a penalty.
  3. Update `exam_participants` with `status: completed` and `total_score`.

### `GET /api/exams/{id}/leaderboard`
- **Optimized Query**: Fetch `exam_participants` where `exam_id == id` and `status == completed`. 
- **Sorting**: Handled automatically using a Firestore composite index on `(exam_id, total_score DESC, time_taken_seconds ASC)`.

---

## 3. Ranking Logic Algorithm

The leaderboard is sorted locally on the client (or via the query directly).

```typescript
participants.sort((a, b) => {
  // 1. Prioritize Higher Marks
  if (b.total_score !== a.total_score) {
    return b.total_score - a.total_score;
  }
  
  // 2. Tie-breaker: Lower Time Spent
  if (a.time_taken_seconds !== b.time_taken_seconds) {
    return a.time_taken_seconds - b.time_taken_seconds;
  }
  
  // 3. Final Tie-breaker: Earlier Submission Timestamp
  return a.submitted_at.toMillis() - b.submitted_at.toMillis();
});
```

---

## 4. Security & Anti-Cheat Measures

1. **Payload Tampering**: Client never receives question answers (`correct_option_index`). Server grades the submission.
2. **Time Tampering**: `joined_at` is generated server-side. At submission, `time_taken` is explicitly verified against `ServerTime.Now - joined_at`.
3. **Tab Switching Detection (Client-Side)**:
   ```javascript
   document.addEventListener("visibilitychange", () => {
     if (document.hidden) {
       logViolation("Tab switched");
       // Optional: Auto-submit on 3rd warning.
     }
   });
   ```
4. **Copy-Paste Prevention**:
   ```javascript
   document.addEventListener("copy", (e) => e.preventDefault());
   document.addEventListener("contextmenu", (e) => e.preventDefault());
   ```
