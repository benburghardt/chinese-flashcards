# Standard Session Start Prompt Template

**Purpose:** Use this template at the beginning of every development session to provide Claude Code with the necessary context efficiently.

---

## Template

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
[Copy/paste the specific task section from development-plan.md]

Example for Task 1.2:
---
### Task 1.2: Data Processing - CC-CEDICT Parser

**Deliverable:** Rust module that parses CC-CEDICT format into structured data.

**Technical Requirements:**
- Parse CC-CEDICT line format
- Handle both characters and multi-character words
- Extract traditional, simplified, pinyin, definitions
- Error handling for malformed lines
- Unit tests for parser

[... rest of task details ...]
---

QUESTION/CONTEXT:
[Optional: Specific question, issue you're facing, or "Ready to begin Task X.X"]
```

---

## Usage Examples

### Example 1: Starting Fresh Task

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 0.1: Verify Development Environment
[paste full task from development-plan.md]

QUESTION/CONTEXT:
Ready to begin Task 0.1. Any preliminary advice before starting?
```

### Example 2: Continuing In-Progress Task

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 1.6: Implement SRS Algorithm (Rust)
[paste full task from development-plan.md]

QUESTION/CONTEXT:
Continuing Task 1.6. Yesterday I completed the interval calculation
functions. Today I need to implement the unlocking logic. Here's my
current code:

[paste relevant code snippet]

I'm unsure about [specific question].
```

### Example 3: Debugging Session

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 1.5: Integrate Database into Tauri Application
[paste full task from development-plan.md]

QUESTION/CONTEXT:
Encountering error when trying to query database from frontend:

Error: [paste error message]

Here's my Tauri command code:
[paste code]

And my frontend code:
[paste code]

What's wrong?
```

### Example 4: Seeking Architectural Advice

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 1.9: Spaced Repetition Session UI
[paste full task from development-plan.md]

QUESTION/CONTEXT:
Before implementing, I want to discuss component architecture.
Based on the spec, the SRS session needs to:
- Track multiple cards in queue
- Handle answer submission
- Show progress
- Cycle incorrect cards

Should I use:
A) Single component with complex state
B) Multiple components (SessionContainer, CardDisplay, AnswerInput)
C) Custom hook for session logic + presentational components

I'm a React beginner, so guidance on best practices appreciated.
```

---

## What NOT to Include

❌ **Don't paste:**
- Entire specification document (use specific sections if needed)
- All of development-plan.md (only current task)
- Old EditHistory archives (unless specifically relevant)
- Entire code files (use relevant excerpts)

✅ **Do paste:**
- DevSummary.md (always)
- CurrentSprint.md (always)
- Current task section (always)
- Specific code snippets causing issues
- Relevant error messages
- Specific spec sections if needed

---

## When You Need Spec Context

If a task requires referencing the specification:

```
CURRENT TASK:
[paste task]

RELEVANT SPEC SECTION:
From chinese-learning-spec.md > [Section Name]:
[paste only the relevant 10-20 lines]

QUESTION/CONTEXT:
[your question]
```

**Example:**
```
RELEVANT SPEC SECTION:
From chinese-learning-spec.md > Database Schema > Characters Table:

CREATE TABLE characters (
  id INTEGER PRIMARY KEY,
  character TEXT UNIQUE NOT NULL,
  simplified TEXT NOT NULL,
  traditional TEXT,
  [... only relevant fields ...]
);

QUESTION/CONTEXT:
Should I add an index on the 'radical' field, or is that premature
optimization?
```

---

## Tips for Efficient Context Loading

1. **Use file mentions:** `@DevSummary.md` and `@CurrentSprint.md` are efficient
2. **Be specific:** Only paste the task you're working on, not entire plan
3. **Minimize spec references:** Use only when truly needed
4. **Code snippets:** Keep to relevant 10-30 lines
5. **Error messages:** Full stack trace is helpful
6. **Ask questions clearly:** State what you've tried and where you're stuck

---

## Session End Workflow

At the end of each session:

1. **Update DevSummary.md:**
   - Change "Current Task" if completed
   - Add to "Key Technical Decisions" if any made
   - Update "Active Technical Debt" if any incurred
   - Update "Next 3 Tasks"

2. **Update CurrentSprint.md:**
   - Add entry for completed work (Brief or Detailed)
   - Use newest-first ordering

3. **Commit to Git:**
   ```bash
   git add docs/DevSummary.md docs/EditHistory/CurrentSprint.md
   git commit -m "[Task X.X] Progress update - [brief description]"
   ```

4. **Archive if needed:**
   - If CurrentSprint.md has >10 entries, move oldest to phase file

---

## Quick Copy Template (Minimal)

For quick sessions, minimum viable prompt:

```
Dev session - Chinese Learning Tool

@DevSummary.md
@CurrentSprint.md

Task X.X: [Name]
[paste task or "continuing Task X.X"]

[Your question/status]
```

---

*This template optimizes for token efficiency while providing comprehensive context.*
*Update this template if you discover better patterns during development.*
