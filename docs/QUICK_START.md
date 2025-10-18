# Quick Start Guide for Development Sessions

**Use this as a quick reference when starting development.**

---

## 📋 Session Start Checklist

Every development session:

1. **Open these files in editor:**
   - [ ] `docs/DevSummary.md`
   - [ ] `docs/EditHistory/CurrentSprint.md`
   - [ ] `docs/development-plan.md` (navigate to current task)

2. **Start conversation with Claude Code:**
   ```
   Starting development session for Chinese Learning Tool.

   CURRENT STATUS:
   @DevSummary.md

   RECENT HISTORY:
   @CurrentSprint.md

   CURRENT TASK:
   [Copy/paste current task from development-plan.md]

   QUESTION/CONTEXT:
   [Your question or "Ready to begin Task X.X"]
   ```

3. **Begin development**

---

## ✏️ After Completing Work

1. **Update CurrentSprint.md:**
   - Add entry at the TOP (newest first)
   - Use Brief template (90% of tasks) or Detailed (complex tasks)

2. **Update DevSummary.md:**
   - Change "Current Task" if completed
   - Add to "Key Technical Decisions" if applicable
   - Update "Next 3 Tasks"
   - Update "Completed Tasks" count

3. **Commit to Git:**
   ```bash
   git add docs/DevSummary.md docs/EditHistory/CurrentSprint.md [other changed files]
   git commit -m "[Task X.X] Brief description"
   ```

4. **Archive if needed:**
   - If CurrentSprint.md has >10 entries, move oldest to phase file

---

## 📝 Entry Templates

### Brief Entry (Use this 90% of the time)
```markdown
## [YYYY-MM-DD] - X.X - Task Name
**Status:** Complete/In Progress/Blocked
**Key Decisions:** [1-2 sentences]
**Issues:** [Brief or "None"]
**Files:** [Key files]
**Tests:** [Pass/Fail]
**Next:** Task X.X
```

### Detailed Entry (Complex tasks only)
See `docs/EditHistory/CurrentSprint.md` for full template.

---

## 🗂️ File Locations

**Always Reference:**
- `docs/DevSummary.md` - Current status (update after each task)
- `docs/EditHistory/CurrentSprint.md` - Recent work (add entries here)

**Reference as Needed:**
- `docs/chinese-learning-spec.md` - Full specifications
- `docs/development-plan.md` - All tasks with details
- `docs/support-sections.md` - Resources, workflows, troubleshooting
- `docs/SESSION_START_PROMPT.md` - Detailed prompt template

**Archives (rarely needed):**
- `docs/EditHistory/Phase0-Setup.md`
- `docs/EditHistory/Phase1-CoreMVP.md`
- etc.

---

## 🎯 Current Focus

**Phase:** See DevSummary.md
**Task:** See DevSummary.md
**Next Tasks:** See DevSummary.md

---

## 💡 Tips

- **Use @ mentions** for files in Claude Code (e.g., `@DevSummary.md`)
- **Keep context minimal** - only paste current task, not entire plan
- **Brief entries are fine** - detailed is for complex/learning tasks only
- **Update DevSummary regularly** - Claude needs current status
- **Archive old entries** - keep CurrentSprint under 10 entries

---

## 🆘 Getting Unstuck

1. Review current task in development-plan.md
2. Check CurrentSprint.md for similar past work
3. Ask Claude Code for help (provide context using session start template)
4. Check support-sections.md troubleshooting guide
5. Take a break and come back fresh

---

## 📊 Progress Tracking

Track overall progress in DevSummary.md:
- **Tasks completed:** X/43
- **Phase progress:** Phase X - Y/Z tasks
- **Recent milestones:** Listed in DevSummary

---

**That's it! Keep it simple, log consistently, and let Claude Code help you build.**

For detailed information, see:
- Full session start template: `docs/SESSION_START_PROMPT.md`
- EditHistory system: `docs/EditHistory/README.md`
- Development workflows: `docs/support-sections.md`
