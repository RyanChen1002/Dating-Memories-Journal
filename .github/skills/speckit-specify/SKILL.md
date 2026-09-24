---
name: "speckit-specify"
description: "Create or update the feature specification from a natural language feature description."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/specify.md"
---

## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks
**Check for extension hooks (before specification)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_specify` key
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline
The text the user typed after `/speckit-specify` in the triggering message **is** the feature description.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the feature:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms

2. **Create the spec feature directory**:
   Specs live under the default `.specify/specs/` directory.
   - Check for existing directories in `.specify/specs/` and use the next available sequential number
   - Construct the directory name: `<NNN>-<short-name>` (e.g., `001-user-auth`)
   - Set `SPECIFY_FEATURE_DIRECTORY` to `.specify/specs/<directory-name>`
   - Create `SPECIFY_FEATURE_DIRECTORY/spec.md`
   - Set `SPEC_FILE` to `SPECIFY_FEATURE_DIRECTORY/spec.md`

3. **IF EXISTS**: Load `.specify/memory/constitution.md` for project principles and governance constraints.

4. Follow this execution flow:
    1. Parse user description from arguments
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

5. Write the specification to SPEC_FILE replacing placeholders with concrete details derived from the feature description while preserving section order and headings.

6. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `SPECIFY_FEATURE_DIRECTORY/checklists/requirements.md`

   b. **Run Validation Check**: Review the spec against each checklist item

   c. **Handle Validation Results**:
      - If all items pass: Mark checklist complete and proceed
      - If items fail: List the failing items, update the spec, re-run (max 3 iterations)
      - If [NEEDS CLARIFICATION] markers remain: Present options to user in table format (max 3 questions)

## Quick Guidelines
- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec.

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item

### Success Criteria Guidelines
Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective
4. **Verifiable**: Can be tested/validated without knowing implementation details

## Completion Report
Report completion to the user with:
- `SPECIFY_FEATURE_DIRECTORY` — the feature directory path
- `SPEC_FILE` — the spec file path
- Checklist results summary
- Readiness for the next phase (`/speckit-clarify` or `/speckit-plan`)

## Done When
- [ ] Specification written to `SPEC_FILE` and validated against quality checklist
- [ ] Completion reported to user with feature directory, spec file path, and checklist results
