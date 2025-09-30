# drools-app


Repo to try in app:

https://git-manager.devin.ai/proxy/github.com/Sai-Kushal-Nerella-WL/drools-rules-lite

Latest code change branch:

Enhance_Intermediate_V1

->https://github.com/Sai-Kushal-Nerella-WL/drools-app/tree/Enhance_Intermediate_V1


Project Document
1. Use Case
The goal is to build an application that makes it easy to manage rules stored in Excel sheets for the Drools open-source rules engine.

The application should handle the entire lifecycle:
- Fetch rules (Excel file) from a Git repository
- Modify rules (add/update/delete rows or columns) in a UI
- Save changes back to Git, with a new branch and Pull Request (PR)
- Ensure Excel files remain Drools-compatible (Decision Table format)

Requirements:
•	UI for Rule Management → Add, update, delete rules and elements
•	Git Integration (Pull) → Fetch Excel from repo
•	Git Integration (Push/PR) → Save changes, create PR for review
•	Excel Handling → Read/write .xlsx or .xls
•	Rules Engine Compatibility → No break in Drools format

2. Approach I Used
- Started with a full prompt to Devin → it gives a good initial setup.
- Problem: Direct full build caused errors, more ACU consumption, and confusion.
- Changed method: Step-by-step build, fixing issues gradually. This also used ACUs but was developer-friendly.
- Learned that after a few prompts, it’s better to switch to a new session for smooth performance.
  
Issue & Suggestion:
•	Full auto mode = fast but unstable
•	Step-by-step = slower but more control
•	Recommendation → Use step-by-step for clarity, and new sessions for performance reset

3. Output Flow
•	Select repo
•	Select branch
•	Configure repo
•	Refresh → See Excel list
•	Select Excel
•	Do changes (add row, column, update data)
•	Save
•	Push changes → commit → PR created
•	Once PR merged → Pull from Git
•	Reconfigure Git → See updated changes

4. Issues Faced in Devin
•	Git Integration with Org: 
  •	Issue: Hard with org repos and permissions. 
  •	Suggestion: Using org-level Git accounts makes user assignment easier.
•	Git Proxy Issues: 
  •	Issue: Failures with proxy setup. 
  •	Suggestion: Provide clear proxy config and health-check option.
•	Session Switching: 
  •	Issue: Context lost between sessions. 
  •	Suggestion: Maintain session summary or provide previous session link to new session.
•	Branch Switching: 
  •	Issue: While running code or after making changes, the current Git branch sometimes switches unexpectedly, causing confusion and misdirected commits.
  •	Suggestion: Enforce branch checks in prompts to prevent unintended auto-switching.
•	Multiple Prompts: 
  •	Issue: Generated incomplete or wrong code. 
  •	Suggestion: Give Devin small, clear tasks with expected output.
•	Auto Code Changes: 
  •	Issue: Changed files not asked for. 
  •	Suggestion: Add 'don’t modify existing code unless asked' in prompts.
•	Auto Push: 
  •	Issue: Code pushed even when not requested. 
  •	Suggestion: Add dry-run mode before pushing.
•	Enterprise Level Gaps: 
  •	Issue: UI made static, not dynamic. 
  •	Suggestion: Use Angular features (responsive, reusable components).

5. Bugs
Bug 1: Add Column → Deleted Row
  Root Cause: Column addition was directly writing to Excel, losing unsaved row.
  Fix: Use in-memory staging (apply changes only on save).
Bug 2: Discard not working
  Reason: Changes were written directly to Excel, so nothing left to discard.
  Fix: Use change log → clear it when discard is clicked.

6. Future Release Ideas
•	Local Git config (no proxy dependency)
•	Search bar in Excel view
•	Multi-branch selection
•	Pushed branch shown as read-only
•	Data validation before save
•	Rule parameters auto pulled from Drools
•	Tagging for sheets
•	Improved UI (responsive, dynamic)
•	Bug fixes & enterprise-level coding practices
