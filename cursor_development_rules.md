# Cursor Development Rules - Linear Workflow Guide

## 1. Pre-Development Phase

### 1.1 Project Initialization
- **RULE**: Complete project setup entirely before writing any application code
- **ACTIONS**:
  - Create project directory structure
  - Initialize version control (git)
  - Set up package.json/requirements.txt/equivalent
  - Configure development environment (ESLint, Prettier, etc.)
  - Create README.md with project overview
- **COMPLETION CRITERIA**: All configuration files exist and are functional

### 1.2 Requirements Definition
- **RULE**: Document ALL requirements before coding begins
- **ACTIONS**:
  - Write detailed feature specifications
  - Define API endpoints/data models
  - List all dependencies and third-party services
  - Create user stories or use cases
  - Define acceptance criteria for each feature
- **COMPLETION CRITERIA**: Requirements document approved and frozen

### 1.3 Architecture Planning
- **RULE**: Design complete system architecture before implementation
- **ACTIONS**:
  - Create folder structure diagram
  - Define component hierarchy
  - Plan database schema (if applicable)
  - Design API structure
  - Identify reusable components/modules
- **COMPLETION CRITERIA**: Architecture document complete with visual diagrams

## 2. Development Phase Rules

### 2.1 Single Task Focus
- **RULE**: Work on exactly ONE feature/component at a time
- **PROHIBITION**: Never start a second task while the first is incomplete
- **DEFINITION OF COMPLETE**: Feature is coded, tested, documented, and committed
- **EXCEPTION HANDLING**: If blocked, document the blocker and move to next planned task only

### 2.2 Linear Development Flow
- **RULE**: Follow strict order of operations for each feature
  1. **Design**: Plan the specific implementation
  2. **Code**: Write the core functionality
  3. **Test**: Create and run tests
  4. **Document**: Add inline and external documentation
  5. **Commit**: Version control with descriptive message
- **PROHIBITION**: Skip no steps, regardless of feature size

### 2.3 Cursor AI Integration Rules
- **RULE**: Use Cursor AI systematically, not reactively
- **STRUCTURED PROMPTING**:
  - Always provide context about current task
  - Specify exact requirements and constraints
  - Request specific output format
  - Ask for one solution at a time
- **EXAMPLE PROMPT FORMAT**:
  ```
  Context: [Current feature/component]
  Task: [Specific action needed]
  Requirements: [List all constraints]
  Output: [Desired format - function, component, etc.]
  ```

### 2.4 Code Implementation Rules
- **RULE**: Complete each code unit before moving to the next
- **CODE UNIT DEFINITION**: Single function, component, or class
- **IMPLEMENTATION ORDER**:
  1. Write function signature/component structure
  2. Implement core logic
  3. Add error handling
  4. Add input validation
  5. Add logging/debugging aids
- **COMPLETION CRITERIA**: Unit passes all tests and handles edge cases

## 3. Testing and Validation Rules

### 3.1 Test-First Mentality
- **RULE**: Define test cases before or during implementation
- **REQUIRED TESTS**:
  - Happy path functionality
  - Edge cases and boundary conditions
  - Error conditions and error handling
  - Integration points (if applicable)
- **COMPLETION CRITERIA**: All tests pass and cover minimum 80% of code

### 3.2 Immediate Validation
- **RULE**: Test each component immediately after implementation
- **VALIDATION STEPS**:
  1. Unit tests pass
  2. Component renders/functions correctly
  3. Integration with existing code works
  4. No console errors or warnings
- **PROHIBITION**: Accumulate untested code

## 4. Documentation and Communication Rules

### 4.1 Inline Documentation
- **RULE**: Document code while writing, not after
- **REQUIRED DOCUMENTATION**:
  - Function/method purpose and parameters
  - Complex logic explanations
  - API endpoint documentation
  - Component prop definitions
- **FORMAT**: Use consistent documentation standards (JSDoc, docstrings, etc.)

### 4.2 Progress Tracking
- **RULE**: Maintain detailed progress log
- **LOG ENTRIES MUST INCLUDE**:
  - Task started and completed timestamps
  - Blockers encountered and resolutions
  - Decisions made and rationale
  - Next planned tasks
- **UPDATE FREQUENCY**: After completing each code unit

## 5. Debugging and Problem Resolution Rules

### 5.1 Systematic Debugging
- **RULE**: Follow structured debugging process when issues arise
- **DEBUG PROCESS**:
  1. Reproduce the issue consistently
  2. Isolate the problematic code section
  3. Use debugging tools (console, debugger, logs)
  4. Form hypothesis about the cause
  5. Test hypothesis with minimal changes
  6. Implement fix and verify resolution
- **PROHIBITION**: Random code changes or trial-and-error fixes

### 5.2 Blocker Management
- **RULE**: Handle blockers immediately and systematically
- **BLOCKER RESOLUTION**:
  1. Document the exact blocker
  2. Research solutions for maximum 30 minutes
  3. If unresolved, seek help or escalate
  4. Move to next planned task if blocker persists
  5. Return to blocked task only when blocker is resolved
- **PROHIBITION**: Work around blockers with hacky solutions

## 6. Version Control and Deployment Rules

### 6.1 Atomic Commits
- **RULE**: Each commit represents one complete, functional change
- **COMMIT STRUCTURE**:
  - Feature implementation
  - Tests for the feature
  - Documentation updates
  - Any necessary configuration changes
- **COMMIT MESSAGE FORMAT**: `type(scope): description` (e.g., `feat(auth): add login validation`)

### 6.2 Branch Management
- **RULE**: Use feature branches for all development
- **BRANCH WORKFLOW**:
  1. Create branch for specific feature
  2. Complete feature entirely on branch
  3. Test thoroughly before merge
  4. Merge only when feature is 100% complete
- **PROHIBITION**: Merge incomplete features

## 7. Quality Assurance Rules

### 7.1 Code Review Standards
- **RULE**: Review all code before considering task complete
- **REVIEW CHECKLIST**:
  - Code follows established patterns
  - No console.log or debugging code remains
  - Error handling is appropriate
  - Performance implications considered
  - Security implications addressed
- **SELF-REVIEW REQUIRED**: Even when working solo

### 7.2 Performance Considerations
- **RULE**: Consider performance impact during implementation
- **PERFORMANCE CHECKS**:
  - Optimize expensive operations
  - Minimize unnecessary re-renders/calculations
  - Consider caching where appropriate
  - Profile memory usage for large operations
- **PROHIBITION**: Premature optimization, but not ignoring obvious performance issues

## 8. Emergency Procedures

### 8.1 Rollback Protocol
- **TRIGGER**: Critical bug discovered in production
- **IMMEDIATE ACTIONS**:
  1. Stop all current development
  2. Assess impact and severity
  3. Implement immediate fix or rollback
  4. Test fix thoroughly
  5. Deploy fix
  6. Resume normal development only after resolution

### 8.2 Scope Creep Management
- **RULE**: Reject scope changes during active development
- **SCOPE CHANGE PROCESS**:
  1. Complete current task entirely
  2. Document proposed scope change
  3. Assess impact on timeline and architecture
  4. Update requirements document
  5. Begin scope change as new planned task
- **PROHIBITION**: Implementing "quick additions" mid-task

## 9. Daily Workflow Rules

### 9.1 Session Startup
- **REQUIRED ACTIONS**:
  1. Review previous session's progress log
  2. Identify the single next task
  3. Ensure development environment is ready
  4. Clear mental focus on one task only
- **DURATION**: Maximum 10 minutes

### 9.2 Session Closure
- **REQUIRED ACTIONS**:
  1. Complete current code unit or reach clean stopping point
  2. Commit any completed work
  3. Update progress log
  4. Plan next session's single task
- **PROHIBITION**: Leave code in broken state

## 10. Success Metrics

### 10.1 Daily Metrics
- **TRACK DAILY**:
  - Number of complete tasks finished
  - Hours spent debugging vs. new development
  - Number of commits made
  - Lines of test code written
- **SUCCESS INDICATORS**: More development than debugging time

### 10.2 Weekly Review
- **WEEKLY ASSESSMENT**:
  - Review adherence to linear workflow
  - Identify most common sources of backtracking
  - Adjust rules based on observed patterns
  - Plan improvements for following week
- **CONTINUOUS IMPROVEMENT**: Update rules based on experience

---

## Quick Reference Checklist

**Before Starting Any Task:**
- [ ] Previous task is 100% complete
- [ ] Requirements for this task are clear
- [ ] Architecture for this task is planned
- [ ] Development environment is ready

**During Task Execution:**
- [ ] Following single-task focus
- [ ] Testing as I code
- [ ] Documenting as I code
- [ ] Using structured Cursor prompts

**Before Completing Task:**
- [ ] All tests pass
- [ ] Code is documented
- [ ] Integration works correctly
- [ ] Committed to version control
- [ ] Progress log updated

**Daily Workflow:**
- [ ] Started with clear task identification
- [ ] Maintained linear progression
- [ ] Ended with complete stopping point
- [ ] Planned tomorrow's single task