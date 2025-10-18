# EditHistory System

**Purpose:** Modular edit history that manages token limits while maintaining comprehensive development journal.

---

## How This System Works

### The Problem
A single EditHistory.md file can easily exceed 25,000 tokens as the project grows, making it impossible for Claude Code to read in a single session.

### The Solution
Split edit history into:
1. **CurrentSprint.md** - Last 5-10 entries (always readable)
2. **Phase Archives** - Historical entries by phase (read only when needed)

---

## File Descriptions

### CurrentSprint.md ⭐
**Purpose:** Rolling log of most recent work
**Size Target:** 5-10 entries maximum
**Usage:** Always include in session start prompt
**Maintenance:** Archive old entries when it exceeds 10

### Phase0-Setup.md
**Purpose:** Archive of Phase 0 (Tasks 0.1-0.5)
**When to use:** Reference only if debugging setup issues
**Status:** Populated as Phase 0 progresses

### Phase1-CoreMVP.md
**Purpose:** Archive of Phase 1 (Tasks 1.1-1.15)
**When to use:** Reference when building on Phase 1 features
**Status:** To be populated during Phase 1

### Phase2-Enhanced.md
**Purpose:** Archive of Phase 2 (Tasks 2.1-2.14)
**When to use:** Reference for enhanced features
**Status:** To be created when starting Phase 2

### Phase3-Cantonese.md
**Purpose:** Archive of Phase 3 (Tasks 3.1-3.9)
**When to use:** Reference for Cantonese features
**Status:** To be created when starting Phase 3

---

## Workflow

### During Development (Daily)

1. **Complete a task**
2. **Add entry to CurrentSprint.md** (at the top, newest first)
3. **Use Brief or Detailed template** based on complexity
4. **Update DevSummary.md** with new status

### Maintenance (Weekly or when CurrentSprint hits 10 entries)

1. **Count entries in CurrentSprint.md**
2. **If >10 entries:**
   - Move oldest entries to appropriate phase file
   - Keep 5-10 most recent in CurrentSprint
3. **Update DevSummary.md** if key decisions were archived

### Phase Completion

1. **Move all CurrentSprint entries** to phase file
2. **Add phase completion summary** to phase file
3. **Start fresh CurrentSprint.md** for next phase

---

## Entry Templates

### Brief Entry (90% of tasks)
```markdown
## [YYYY-MM-DD] - X.X - Task Name
**Status:** Complete/In Progress/Blocked
**Key Decisions:** [1-2 sentences]
**Issues:** [Brief or "None"]
**Files:** [Key files]
**Tests:** [Pass/Fail]
**Next:** Task X.X
```

### Detailed Entry (Complex tasks)
```markdown
## [YYYY-MM-DD] - X.X - Task Name [DETAILED]
**Task:** [Full name]
**Status:** [Status]
**Objective:** [What you were trying to do]
**Decisions Made:** [List with rationale]
**Issues Encountered:** [Detailed bugs/challenges]
**Solutions Applied:** [How resolved + what didn't work]
**Code Changes:** [Created/Modified files with descriptions]
**Testing Results:** [Detailed results]
**Notes for Future:** [Lessons, tech debt, improvements]
**Time Spent:** [Optional]
**Next Steps:** [Next task]
```

---

## When to Use Detailed Entries

Use Detailed format when:
- ✅ Task involved significant debugging
- ✅ Multiple approaches were tried
- ✅ Architectural decision with long-term impact
- ✅ Learning moment worth documenting thoroughly
- ✅ Future you will need this context

Use Brief format when:
- ✅ Straightforward implementation
- ✅ No major blockers
- ✅ Standard approach worked
- ✅ Quick reference sufficient

**Rule of thumb:** If explaining it to a colleague would take >5 minutes, use Detailed.

---

## Integration with Claude Code

### Every Session Start
Provide Claude with:
1. `@DevSummary.md`
2. `@CurrentSprint.md`
3. Current task section from development-plan.md

### When Claude Needs History
Claude will ask: "Can you provide the EditHistory for Phase X?"
Then you share the specific phase file.

### What NOT to Do
❌ Don't paste entire phase archives unless requested
❌ Don't let CurrentSprint grow beyond 10 entries
❌ Don't forget to update DevSummary.md

---

## Example: Good Archiving

**CurrentSprint.md before archiving (12 entries):**
```
## [2025-11-05] - 1.10 - Answer Verification
## [2025-11-04] - 1.9 - SRS Session UI
## [2025-11-03] - 1.8 - Card Introduction
## [2025-11-02] - 1.7 - Progress Commands
## [2025-11-01] - 1.6 - SRS Algorithm
## [2025-10-31] - 1.5 - Database Integration
## [2025-10-30] - 1.4 - Database Builder
## [2025-10-29] - 1.3 - SUBTLEX Parser
## [2025-10-28] - 1.2 - CEDICT Parser
## [2025-10-27] - 1.1 - Download Scripts
## [2025-10-26] - 0.5 - Schema Design
## [2025-10-25] - 0.4 - License Setup
```

**Action:** Move 6 oldest entries to phase files

**CurrentSprint.md after archiving (6 entries):**
```
## [2025-11-05] - 1.10 - Answer Verification
## [2025-11-04] - 1.9 - SRS Session UI
## [2025-11-03] - 1.8 - Card Introduction
## [2025-11-02] - 1.7 - Progress Commands
## [2025-11-01] - 1.6 - SRS Algorithm
## [2025-10-31] - 1.5 - Database Integration
```

**Phase0-Setup.md receives:**
```
## [2025-10-26] - 0.5 - Schema Design
## [2025-10-25] - 0.4 - License Setup
```

**Phase1-CoreMVP.md receives:**
```
## [2025-10-30] - 1.4 - Database Builder
## [2025-10-29] - 1.3 - SUBTLEX Parser
## [2025-10-28] - 1.2 - CEDICT Parser
## [2025-10-27] - 1.1 - Download Scripts
```

---

## Token Efficiency Stats

**Single EditHistory.md (traditional):**
- After Phase 1: ~15,000 tokens
- After Phase 2: ~30,000 tokens (exceeds limit!)
- After Phase 3: ~45,000 tokens (unusable)

**Modular System:**
- CurrentSprint.md: ~800-1,500 tokens (always readable)
- DevSummary.md: ~500 tokens (always readable)
- Total context per session: ~1,500-2,000 tokens ✅
- Phase archives: Read only when needed

---

## Tips for Success

1. **Log immediately** after completing work (while fresh)
2. **Use Brief entries** for 90% of tasks (save tokens)
3. **Be consistent** with updating DevSummary.md
4. **Archive proactively** (don't wait until 20 entries)
5. **Reference past work** by asking Claude to read specific phase files

---

**This system ensures Claude Code always has recent context without hitting token limits.**
