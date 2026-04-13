-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: Remove duplicate Attendance rows, keep only the latest per (SessionID, StudentID)
-- Then add a UNIQUE constraint to prevent this from ever happening again
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Remove duplicate rows, keeping the one with the highest ID (most recent insert)
DELETE a1
FROM Attendance a1
INNER JOIN Attendance a2
  ON  a1.SessionID  = a2.SessionID
  AND a1.StudentID  = a2.StudentID
  AND a1.ID < a2.ID;

-- Step 2: Add UNIQUE constraint so ON DUPLICATE KEY / DELETE+INSERT work correctly
ALTER TABLE Attendance
  ADD CONSTRAINT uq_attendance_session_student
  UNIQUE (SessionID, StudentID);
