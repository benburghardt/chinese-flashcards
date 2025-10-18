# Example Session Start

**This is a complete example of how to start your next development session.**

Copy this template and replace the bracketed sections with actual content.

---

## Copy This Prompt Template

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 0.1: Verify Development Environment

**Deliverable:** Confirmed working development environment with all tools at correct versions.

**Steps:**
1. Verify Node.js installation
   ```bash
   node --version  # Should be v18+
   npm --version
   ```

2. Verify Rust installation
   ```bash
   rustc --version  # Should be latest stable
   cargo --version
   ```

3. Verify Tauri CLI
   ```bash
   cargo tauri --version  # Should be latest
   ```

4. Test basic Tauri build (using Extended-Flashcards)
   ```bash
   cd Extended-Flashcards
   npm install
   npm run tauri:dev
   ```

**Success Criteria:**
- ✅ Node.js v18+ installed and working
- ✅ Rust stable toolchain installed and working
- ✅ Tauri CLI installed and working
- ✅ Extended-Flashcards builds and runs successfully
- ✅ Hot reload works in dev mode
- ✅ No build errors or warnings

**Acceptance Test:**
- Extended-Flashcards app launches
- Can create a basic flashcard
- Frontend changes hot-reload
- Rust backend compiles without errors

QUESTION/CONTEXT:
Ready to begin Task 0.1. Any preliminary advice before I start verifying the environment?
```

---

## What Happens Next

After pasting the above prompt:

1. **Claude Code will:**
   - Read DevSummary.md (current project status)
   - Read CurrentSprint.md (recent work - currently empty)
   - Review Task 0.1 requirements
   - Provide guidance on starting the task

2. **You will:**
   - Follow Claude's guidance
   - Execute the verification steps
   - Report results

3. **After completing Task 0.1:**
   - Add entry to `docs/EditHistory/CurrentSprint.md`
   - Update `docs/DevSummary.md`
   - Commit changes

---

## Subsequent Sessions

For your second session (e.g., Task 0.2):

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 0.2: Install Additional Dependencies
[paste full task from development-plan.md]

QUESTION/CONTEXT:
Completed Task 0.1 yesterday. Ready to install additional dependencies.
Any recommendations on the order of installation?
```

**Key difference:** CurrentSprint.md will now have your Task 0.1 entry, providing context.

---

## Mid-Task Session (Debugging)

If you encounter an issue mid-task:

```
Starting development session for Chinese Learning Tool.

CURRENT STATUS:
@DevSummary.md

RECENT HISTORY:
@CurrentSprint.md

CURRENT TASK:
### Task 1.5: Integrate Database into Tauri Application
[paste relevant parts]

QUESTION/CONTEXT:
Working on Task 1.5. Hit an error when trying to run tauri:dev:

Error: failed to bundle project: error running build.rs
Caused by: could not find rusqlite

Here's my Cargo.toml:
[paste Cargo.toml dependencies section]

What am I missing?
```

---

## Why This Works

**Token Efficiency:**
- DevSummary.md: ~500 tokens
- CurrentSprint.md: ~800-1,500 tokens (grows, but you'll archive)
- Current task: ~300-500 tokens
- Your question: ~100-200 tokens
- **Total: ~2,000-3,000 tokens** (well under limit)

**Context Completeness:**
Claude Code knows:
- ✅ Where you are in the project (DevSummary)
- ✅ What you've recently done (CurrentSprint)
- ✅ What you're working on now (Current Task)
- ✅ Your specific question/need

**No Need For:**
- ❌ Entire specification (reference as needed)
- ❌ Full development plan (just current task)
- ❌ Entire EditHistory (just recent sprint)

---

## Your First Real Session

When you're ready to actually start development:

1. Open Claude Code
2. Copy the template from the top of this file
3. Use @ to reference DevSummary.md and CurrentSprint.md
4. Paste Task 0.1 from development-plan.md
5. Add your question
6. Send!

---

## Tips for Success

- **Be consistent:** Always use this format
- **Keep it simple:** Don't over-explain your question
- **Trust the system:** DevSummary + CurrentSprint provides enough context
- **Update docs:** After each task, update both files
- **Archive regularly:** Keep CurrentSprint under 10 entries

---

**You're all set! The documentation system is ready for your development journey.**

Next step: Start your first real session with Task 0.1! 🚀
