# GSD Preferences

## Agent Usage
- Use subagents liberally — tokens are not a constraint
- Prefer parallel execution when tasks are independent (e.g. scout + test + fix)
- Use scout agent for codebase exploration before implementing
- Use chain mode (scout → planner → worker) for non-trivial features

## Testing
- Always write automated tests for bug fixes before committing
- Run browser verification after UI changes — don't trust unit tests alone for UX
