---
name: "speckit-plan"
description: "Execute the implementation planning workflow to generate architecture design and tech stack."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/plan.md"
---

## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks
**Check for extension hooks (before planning)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_plan` key
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline
1. **Load context**: Read the latest `spec.md` from `.specify/specs/`. Read `.specify/memory/constitution.md` for governance constraints.

2. **Execute plan workflow**: Generate a `plan.md` file in the same feature folder containing:
   - High-Level Architecture Diagram
   - Technology Stack choices
   - Component Breakdown
   - Data Architecture / Storage Model
   - Security Plan
   - Development Workflow & File Structure

3. **Phase 1: Design Artifacts**:
   - Create `data-model.md` based on entities found in the spec (if needed)

4. **Constitution Check**:
   - Ensure the generated plan does not violate any core principles in `constitution.md`.

5. Write the final `plan.md` to `.specify/specs/<feature-folder>/plan.md`.

## Completion Report
Output path to generated plan.md and confirmation that the tech stack chosen aligns with the project constitution.

## Done When
- [ ] plan.md generated detailing architecture and stack
- [ ] Completion reported to user
