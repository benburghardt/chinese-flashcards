# Development Support & Resources

This document contains supporting materials for the Chinese Learning Tool development:
- EditHistory.md logging guidelines
- Quality gates and phase transitions
- Risk management strategies
- Resources and learning materials
- Development workflows
- Troubleshooting guide
- Success metrics

---

## EditHistory.md Logging Guidelines

**Purpose:** EditHistory.md serves as a comprehensive development journal tracking all major decisions, bugs, and solutions.

### When to Log

**Log After:**
- Completing each task
- Making significant technical decisions
- Encountering and solving bugs
- Discovering important learnings
- Making architectural changes
- Completing integration testing
- Phase completion gates

### Entry Template

```markdown
## [YYYY-MM-DD] - [Task Number] - [Brief Title]

**Task:** [Full task number and name]

**Status:** [Complete / In Progress / Blocked]

**Objective:** 
[What you were trying to accomplish]

**Decisions Made:**
- [Key technical or design decision 1]
- [Key technical or design decision 2]
- [Rationale for each decision]

**Issues Encountered:**
- [Bug 1: Description]
- [Bug 2: Description]
- [Challenge 1: Description]

**Solutions Applied:**
- [How Bug 1 was resolved]
- [How Bug 2 was resolved]
- [Alternative approaches considered]

**Code Changes:**
- [Files created]
- [Files modified]
- [Key functions/components added]
- [Dependencies added]

**Testing Results:**
- [Pass/Fail for each acceptance criterion]
- [What was tested]
- [Edge cases discovered]

**Notes for Future:**
- [Lessons learned]
- [Technical debt incurred]
- [Areas for improvement]
- [Things to remember for similar tasks]

**Time Spent:** [Optional: Hours or days invested]

**Next Steps:**
[What task comes next]
```

### Best Practices

**Do:**
- ✅ Log immediately after completing task
- ✅ Be specific about bugs and solutions
- ✅ Include code file paths
- ✅ Note time spent (helps estimate future tasks)
- ✅ Record alternative approaches considered
- ✅ Document "why" not just "what"
- ✅ Include lessons learned
- ✅ Reference external resources used

**Don't:**
- ❌ Wait to log multiple tasks at once (details forgotten)
- ❌ Copy-paste code into log (keep concise)
- ❌ Skip logging small decisions (they add up)
- ❌ Use vague descriptions ("fixed bug" - what bug?)
- ❌ Forget to update status if returning to task
- ❌ Skip logging successful approaches (future reference)

---

## Quality Gates & Phase Transitions

### Definition of "Done" for a Task

A task is complete when:
1. ✅ All success criteria met
2. ✅ Acceptance test passed
3. ✅ Code committed to git with clear message
4. ✅ EditHistory.md entry created
5. ✅ No critical bugs remaining
6. ✅ Code formatted and passes linters
7. ✅ Next task identified

### Phase Completion Checklist Template

```markdown
## Phase [N] Completion Gate

Date: [YYYY-MM-DD]

### Completion Status
- [ ] All tasks completed (count: X/X)
- [ ] All success criteria met
- [ ] Integration testing passed
- [ ] Code cleanup completed
- [ ] No critical bugs
- [ ] Performance acceptable

### Documentation Status
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] EditHistory.md complete
- [ ] License compliance verified
- [ ] Code comments adequate

### Quality Metrics
- [ ] Linter warnings: 0
- [ ] Test coverage: [X%]
- [ ] Performance tests passed
- [ ] Cross-platform verified (Windows minimum)

### Git Status
- [ ] All changes committed
- [ ] Git tag created: vX.X.X-phaseN
- [ ] Branch clean (no uncommitted changes)

### Phase Learnings
[Key lessons learned during this phase]

### Technical Debt
[Known issues deferred to future phases]

### Ready for Next Phase?
[Yes/No with justification]

### Approval
Developer: [Your name]
Date: [YYYY-MM-DD]
```

---

## Risk Management Strategies

### Technical Risks

**1. Database Corruption**
- **Risk:** SQLite file corrupted during write operation
- **Mitigation:** Use transactions, backup before major operations
- **Recovery:** Keep last 3 backup copies, rebuild from datasets

**2. Web Speech API Limitations**
- **Risk:** Poor quality or unavailable on some platforms
- **Mitigation:** Fallback to text-only mode, provide clear error messages
- **Recovery:** Plan Azure migration in Phase 3

**3. Cross-Platform Compatibility**
- **Risk:** Works on Windows but breaks on Mac/Linux
- **Mitigation:** Test on multiple platforms if available, use portable code
- **Recovery:** Virtual machines for testing, community testing

**4. Performance Degradation**
- **Risk:** App slows down with large datasets
- **Mitigation:** Use database indexes, lazy loading, pagination
- **Recovery:** Profiling tools, optimization tasks

**5. Stroke Verification Too Strict/Lenient**
- **Risk:** Users frustrated with writing practice
- **Mitigation:** Adjustable tolerance setting, user feedback
- **Recovery:** Iterative tuning, collect user data

### Data Risks

**1. Dataset License Changes**
- **Risk:** CC-CEDICT or SUBTLEX-CH change licenses
- **Mitigation:** Monitor source websites, maintain local copies
- **Recovery:** Seek alternative datasets, contact maintainers

**2. Dataset URL Changes**
- **Risk:** Download scripts break
- **Mitigation:** Document manual download procedures
- **Recovery:** Update URLs, provide manual download option

**3. Data Quality Issues**
- **Risk:** Incorrect definitions or pronunciations
- **Mitigation:** Use reputable sources, allow user reporting
- **Recovery:** Data correction pipeline, community contributions

### Development Risks

**1. Scope Creep**
- **Risk:** Adding features not in specifications
- **Mitigation:** Stick to phase plan, defer nice-to-haves
- **Recovery:** Create "Phase 4" backlog for extras

**2. Burnout**
- **Risk:** Long development timeline causes fatigue
- **Mitigation:** Take breaks between phases, celebrate milestones
- **Recovery:** Adjust pace, reduce scope if needed

**3. Technology Learning Curve**
- **Risk:** Rust/Tauri/React learning slows development
- **Mitigation:** Budget time for learning, use Claude Code for help
- **Recovery:** Simplify implementations, focus on working code first

---

## Resources & Learning Materials

### Rust Learning

**Official Resources:**
- Rust Book: https://doc.rust-lang.org/book/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- Rustlings (exercises): https://github.com/rust-lang/rustlings

**Recommended Focus:**
- Chapters 1-10 (fundamentals)
- Error handling (Chapter 9)
- Testing (Chapter 11)

**Your Advantage:** C++ experience helps with ownership concepts

### React & TypeScript

**Official Resources:**
- React Docs: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/

**Recommended Focus:**
- React Hooks (useState, useEffect, custom hooks)
- TypeScript with React
- Component composition

**Your Advantage:** JavaScript experience translates directly

### Tauri Learning

**Official Resources:**
- Tauri Docs: https://tauri.app/v1/guides/
- Tauri Examples: https://github.com/tauri-apps/tauri/tree/dev/examples

**Key Topics:**
- Tauri commands (frontend ↔ backend)
- State management
- Bundling resources

### SQLite

**Resources:**
- SQLite Documentation: https://www.sqlite.org/docs.html
- rusqlite docs: https://docs.rs/rusqlite/

**Your Advantage:** Very experienced with SQL - focus on rusqlite API specifics

### Chinese Language Data

**Resources:**
- CC-CEDICT Wiki: https://cc-cedict.org/wiki/
- SUBTLEX-CH Paper: https://doi.org/10.1371/journal.pone.0010729
- Make Me a Hanzi: https://github.com/skishore/makemeahanzi
- Unihan Database: https://unicode.org/charts/unihan.html

### Web Speech API

**Resources:**
- MDN Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

**Browser Support:**
- Chrome/Edge: Full support (best for development)
- Firefox: Partial support
- Safari: Partial support

### Azure Speech Services (Phase 3)

**Resources:**
- Azure Speech Docs: https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/

**Key Topics:**
- Neural voices
- API key management
- Free tier limitations (0.5M chars/month)

### Claude Code Usage Tips

**Effective Prompting:**
- Provide full context (show relevant files)
- Be specific about what you want
- Mention your experience level
- Ask for explanations, not just code
- Request alternatives when stuck

**Example Prompts:**
- "I'm implementing Task 1.2 (CC-CEDICT parser). Here's the file format [paste example]. Help me design a Rust struct and parser function. I'm a Rust beginner but experienced in C++."
- "This Tauri command is failing with [error]. Here's my Rust code [paste]. What's wrong and how do I fix it?"
- "I need to display stroke order animations. What's the best React component structure?"

**What to Share:**
- Current task from development plan
- Relevant code files
- Error messages (full stack traces)
- What you've tried already

---

## Development Workflows

### Daily Workflow

**Start of Day:**
1. Review yesterday's EditHistory.md entry
2. Check current task in development plan
3. Review task success criteria
4. Set up development environment (`npm run tauri:dev`)

**During Development:**
1. Focus on one task at a time (vertical slice)
2. Make small, frequent commits
3. Test frequently (don't wait until "done")
4. Document decisions as you go
5. Use Claude Code for help when stuck

**End of Day:**
1. Commit work in progress (even if incomplete)
2. Write EditHistory.md entry (progress update)
3. Note blockers or questions for tomorrow
4. Clean up debug code if any
5. Review tomorrow's task

### Weekly Workflow

**Monday:**
- Review last week's progress
- Plan week's tasks (aim for 2-3 tasks)

**Friday:**
- Review week's EditHistory.md entries
- Test week's work end-to-end
- Commit and push all changes
- Plan next week

**Weekly Review Questions:**
- What went well?
- What was challenging?
- Any changes needed to plan?
- Key learnings to document?

### Git Workflow

**Commit Messages Format:**
```
[Task X.X] Brief description of change

- Detail 1
- Detail 2

Relates to: Task X.X in DEVELOPMENT_PLAN.md
```

**Example:**
```
[Task 1.2] Implement CC-CEDICT parser

- Created cedict.rs parser module
- Added CedictEntry struct
- Implemented line parsing with error handling
- Added 3 unit tests

Relates to: Task 1.2 in DEVELOPMENT_PLAN.md
```

**Branching Strategy:**
- `main` branch: stable, working code
- `feature/task-X.X`: work in progress
- Merge to main after task completion and testing

**Tagging:**
- After Phase 1: `v0.1.0-phase1`
- After Phase 2: `v0.2.0-phase2`
- After Phase 3: `v1.0.0-phase3`

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue: Tauri app won't build**

**Symptoms:** `cargo tauri build` fails with errors

**Solutions:**
1. Check Rust version: `rustc --version` (need stable)
2. Check Node version: `node --version` (need 18+)
3. Update dependencies: `cargo update`, `npm update`
4. Clean build: `cargo clean`, `rm -rf node_modules`, reinstall
5. Check tauri.conf.json for syntax errors

---

**Issue: Database queries slow**

**Symptoms:** App freezes or lags when loading data

**Solutions:**
1. Check indexes: `EXPLAIN QUERY PLAN SELECT ...`
2. Add missing indexes on frequently queried columns
3. Use LIMIT on large result sets
4. Profile queries with SQLite EXPLAIN

---

**Issue: Web Speech API not working**

**Symptoms:** TTS/STT features don't work

**Solutions:**
1. Check browser compatibility (Chrome/Edge best)
2. Verify HTTPS/secure context (required for STT)
3. Check microphone permissions
4. Test with simple example outside app
5. Fallback to text-only mode if unsupported

---

**Issue: Chinese characters display as boxes**

**Symptoms:** Characters show as □ or ?

**Solutions:**
1. Install Chinese fonts on system
2. Add font fallback in CSS:
   ```css
   font-family: "Microsoft YaHei", "SimHei", sans-serif;
   ```
3. Verify text encoding is UTF-8
4. Check database encoding: `PRAGMA encoding;`

---

**Issue: Hot reload stops working**

**Symptoms:** Changes don't reflect in running app

**Solutions:**
1. Restart dev server: `npm run tauri:dev`
2. Clear browser cache (in Tauri webview)
3. Check for syntax errors in code
4. Verify vite.config.ts is correct

---

**Issue: Tests failing after refactor**

**Symptoms:** `cargo test` shows failures

**Solutions:**
1. Review what changed
2. Update test expectations if intentional
3. Check for breaking changes in dependencies
4. Run individual tests: `cargo test test_name`
5. Check EditHistory.md for similar past issues

---

**Issue: Performance regression**

**Symptoms:** App slower than before

**Solutions:**
1. Profile with browser dev tools
2. Check for database query regressions
3. Review recent code changes
4. Test with smaller dataset
5. Consider lazy loading / pagination

---

## Success Metrics

### Phase 1 Success Metrics

**Functionality:**
- ✅ 15 characters accessible on first run
- ✅ SRS session completes without errors
- ✅ Cards unlock at 1-week interval
- ✅ Self-study mode functional
- ✅ Progress dashboard displays correctly

**Performance:**
- ✅ App launches in < 5 seconds
- ✅ Database queries < 100ms
- ✅ UI interactions < 100ms
- ✅ Memory usage < 500MB

**Quality:**
- ✅ No crashes in normal usage
- ✅ Data integrity maintained
- ✅ Professional UI appearance

### Phase 2 Success Metrics

**Functionality:**
- ✅ 9000+ characters have stroke order
- ✅ Writing practice accepts correct strokes
- ✅ Speech recognition works (70%+ accuracy)
- ✅ All 7 study modes functional

**Performance:**
- ✅ Stroke animations smooth (60fps)
- ✅ Drawing canvas responsive
- ✅ Speech recognition < 1 second latency

**Quality:**
- ✅ No regressions from Phase 1
- ✅ Stroke verification fair

### Phase 3 Success Metrics

**Functionality:**
- ✅ Traditional characters display correctly
- ✅ Cantonese pronunciations accurate
- ✅ Toggle mode works smoothly
- ✅ Dual-dialect learning functional

**Performance:**
- ✅ No performance degradation
- ✅ Azure Speech (if used) < 2 second latency

**Quality:**
- ✅ Complete application polished
- ✅ Documentation comprehensive

### Overall Project Success

**Measured by:**
- All phase completion gates passed
- All features in specifications implemented
- License compliance maintained
- Professional quality throughout
- Documentation complete and accurate
- No critical bugs
- Performance acceptable
- Cross-platform compatible

**Personal Success:**
- Learned Rust, Tauri, React deeply
- Built complete production application
- Gained experience with large project
- Created learning tool for personal use
- Documented journey in EditHistory.md

---

## Post-Launch: Maintenance & Future

### After v1.0.0 Release

**Maintenance Tasks:**
- Monitor for bugs
- Update dependencies periodically
- Respond to user feedback (if shared)
- Fix critical issues

### Potential Phase 4 Features

If you want to continue development:
- Multiple choice mode
- Flash mode (Extended-Flashcards style)
- Custom study lists
- HSK level tracking
- Example sentences
- Character etymology explorer
- Handwriting recognition (alternative to drawing)
- Anki deck import/export
- Cloud sync
- Mobile app version

### Personal Goals

- Use app for actual Chinese learning
- Track learning progress
- Iterate based on personal experience
- Maintain as long-term project

---

## Final Developer Notes

### Remember

**Core Principles:**
- Progress over perfection
- Working code beats perfect architecture
- Test early and often
- Document decisions while fresh
- Take breaks between phases
- Celebrate milestones
- Learn from mistakes

**When Stuck:**
1. Review specifications
2. Check EditHistory.md for similar issues
3. Read relevant documentation
4. Ask Claude Code for help
5. Simplify the problem
6. Take a break and come back
7. Consider alternative approach

**Success Factors:**
- Consistent progress (not speed)
- Good documentation habits
- Willingness to learn
- Vertical slicing approach
- Testing as you go
- Clean code practices

### Using These Documents

**You now have 4 documents:**
1. **DEVELOPMENT_PLAN.md** - Phase 0 & Phase 1 (complete)
2. **Phase 2: Enhanced Learning Features** - 14 tasks
3. **Phase 3: Cantonese Expansion** - 9 tasks
4. **Development Support & Resources** - This document

**How to use:**
1. Follow tasks in order (mostly)
2. Adapt as you learn more
3. Skip tasks if truly unnecessary
4. Add tasks if needed
5. Update plans as you go
6. Reference when planning
7. Review when stuck

**This is:**
- A roadmap, not a strict schedule
- A guide, not gospel
- Adaptable to your pace
- Reference material

**This is NOT:**
- A deadline-driven project plan
- Comprehensive code implementation
- Replacement for decision-making
- Fixed and unchangeable

---

## Quick Reference

### Estimated Timeline (Part-Time)

- **Phase 0:** 1-2 days
- **Phase 1:** 4-6 weeks (15 tasks)
- **Phase 2:** 3-4 weeks (14 tasks)
- **Phase 3:** 2-3 weeks (9 tasks)
- **Total:** 10-14 weeks

### Task Counts

- **Phase 0:** 5 tasks (Environment)
- **Phase 1:** 15 tasks (Core MVP)
- **Phase 2:** 14 tasks (Enhanced Features)
- **Phase 3:** 9 tasks (Cantonese)
- **Total:** 43 tasks

### Your Advantages

- ✅ Very experienced with SQL
- ✅ Experienced with JavaScript
- ✅ Experienced with C++
- ✅ Claude Code available
- ✅ Clear specifications
- ✅ No deadline pressure

### Next Step

**Begin Task 0.1:** Verify Development Environment

Good luck with your development journey! 🚀

---

*Document Version: 1.0*  
*Last Updated: October 2025*  
*Status: Complete and Ready for Development*