# Drools App - Repository Understanding Guide

**Purpose:** Complete understanding of the drools-app repository structure, architecture, and functionality for future Devin sessions.

**Last Updated:** October 1, 2025

---

**Used Case Received :**
The goal is to create an intuitive application that streamlines the management of rules defined in Excel sheets, particularly for integration with Drools open-source rules engine. 
The application will handle the entire lifecycle from fetching rules, enabling modifications, to proposing changes via Git.

**Requirements**
•	UI for Rule Management: Provide a user-friendly interface to view, add, update, and delete rules (rows) and rule elements (columns).
•	Git Integration (Pull): Fetch the rules Excel sheet from a specified Git repository.
•	Git Integration (Push/PR): Save updated rules back to the Git repository, creating a new branch and submitting a Pull Request for review.
•	Excel Handling: Read and write Excel files (.xlsx or .xls).
•	Rules Engine Compatibility: The output Excel format should remain compatible with Drools Decision Table.


## 📁 **Repository Structure**

```
drools-app/
├── drools-backend/          # Spring Boot backend (Java)
├── drools-frontend/         # Angular frontend (TypeScript)
├── rules/                   # Excel decision tables directory
│   └── SampleRules.xlsx     # Example rules file
├── README.md               # Project documentation
├── BUGS_AND_ISSUES.md      # Comprehensive bug report
└── REPOSITORY_UNDERSTANDING.md # This file
```

---

## 🏗 **Architecture Overview**

### **Frontend (Angular 17+)**
- **Port:** 4200 (development server)
- **Framework:** Angular with Bootstrap styling
- **Key Features:**
  - Excel decision table editor/viewer
  - Git integration (pull, push, PR creation)
  - Repository configuration management
  - Real-time rule editing with save functionality

### **Backend (Spring Boot)**
- **Port:** 8080 (API server)
- **Framework:** Spring Boot with Maven
- **Key Features:**
  - Excel file processing (Apache POI)
  - Git operations (JGit + ProcessBuilder)
  - Drools rule execution engine
  - REST API for frontend communication

---

## 🚀 **How to Start the Application**

### **Prerequisites**
- Java 17+ (backend)
- Node.js 16+ (frontend)
- Maven (backend build)
- npm/yarn (frontend dependencies)

### **Startup Commands**
```bash
# Backend (from drools-backend/)
mvn spring-boot:run

# Frontend (from drools-frontend/)
npm start
```

### **Access URLs**
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080/api
- API Documentation: Not implemented (consider adding Swagger)

---

## 📊 **Core Functionality**

### **1. Excel Decision Table Management**
- **Location:** `ExcelService.java`, `rules-grid.component.ts`
- **Features:**
  - Read/write Excel files containing Drools decision tables
  - Column management (add/delete CONDITION and ACTION columns)
  - Row management (add/delete/edit rules)
  - Real-time editing with validation
  - Rule name mandatory validation

### **2. Git Integration**
- **Location:** `GitService.java`, `GitController.java`
- **Features:**
  - Pull latest changes from remote repository
  - Push changes to new branches
  - Create pull requests (UI only - not implemented in backend)
  - Branch name generation with timestamps

### **3. Repository Configuration**
- **Location:** `RepositoryConfigService.java`, `repository-setup.component.ts`
- **Features:**
  - Configure Git repository URL and branch
  - **NEW:** Folder selection within repository - users can select specific folders containing Excel files
  - Store configuration in localStorage (frontend) and JSON file (backend)
  - Validate repository connectivity
  - Fetch and display available folders in repository

### **4. Rule Execution (Drools)**
- **Location:** `DroolsService.java`
- **Features:**
  - Execute business rules against input data
  - Validate Drools decision table structure
  - Return rule execution results

---

## 🗂 **Key Components Deep Dive**

### **Backend Services**

#### **ExcelService** (`service/ExcelService.java`)
- **Purpose:** Handle all Excel file operations
- **Key Methods:**
  - `readDecisionTable()` - Parse Excel into DecisionTableView
  - `saveDecisionTable()` - Write DecisionTableView to Excel
  - `addColumn()` / `deleteColumn()` - Column management
  - `insertColumnAtPosition()` / `removeColumnAtPosition()` - Low-level Excel manipulation
- **Dependencies:** Apache POI for Excel processing
- **⚠ Critical Issues:** No file locking, unsafe concurrent access

#### **GitService** (`service/GitService.java`)
- **Purpose:** Handle Git operations
- **Key Methods:**
  - `pullFromRepo()` - Pull latest changes (with destructive git reset)
  - `pushToRepo()` - Push to new branch
  - `createPullRequest()` - Create PR (not implemented)
  - `generateBranchName()` - Create timestamped branch names
- **Dependencies:** JGit library + ProcessBuilder for git commands
- **⚠ Critical Issues:** Destructive operations, no thread safety, incomplete PR creation

#### **DroolsService** (`service/DroolsService.java`)
- **Purpose:** Execute business rules using Drools engine
- **Key Methods:**
  - `executeRules()` - Run rules against input data
  - `validateDroolsDecisionTableStructure()` - Validate table structure
- **Dependencies:** Drools rule engine
- **Status:** Working but no frontend UI

#### **RepositoryConfigService** (`service/RepositoryConfigService.java`)
- **Purpose:** Manage repository configuration
- **Key Methods:**
  - `saveConfig()` / `getConfig()` - Configuration CRUD
  - `getRepositoryPath()` - Calculate local repo path including folder path (for Excel operations)
  - **NEW:** `getRepositoryRootPath()` - Get repository root path (for git operations)
  - `isConfigured()` - Validate configuration
- **✅ Fixed:** Configuration now persisted to `drools-config.json` file (survives restarts)

### **Frontend Components**

#### **RulesGridComponent** (`components/rules-grid/rules-grid.component.ts`)
- **Purpose:** Main Excel editor interface
- **Key Features:**
  - Display decision table in grid format
  - Add/delete columns and rows
  - Save changes to backend
  - Git operations (pull, push, PR)
- **Key Methods:**
  - `save()` - Save table with rule name validation
  - `addColumn()` / `validateAndDeleteColumn()` - Column management
  - `pushToGit()` - Git push workflow
- **⚠ Fixed Issues:** Column data misalignment, rule name validation

#### **FileListComponent** (`components/file-list/file-list.component.ts`)
- **Purpose:** File selection interface
- **Key Features:**
  - List available Excel files
  - Select file for editing
  - Pull updates from Git
- **Key Methods:**
  - `loadFiles()` - Fetch file list from backend
  - `pullFromGit()` - Trigger git pull operation

#### **RepositorySetupComponent** (`components/repository-setup/repository-setup.component.ts`)
- **Purpose:** Git repository configuration
- **Key Features:**
  - Configure repository URL and branch (now accepts direct GitHub/GitLab URLs)
  - **NEW:** Folder selection dropdown with "Fetch Folders" button
  - **NEW:** Fetches available folders from repository without requiring pull
  - Validate repository connection with improved URL pattern validation
  - Store configuration persistently (frontend: localStorage, backend: JSON file)
- **✅ Fixed:** URL validation now checks for valid GitHub/GitLab patterns

### **Models & Data Flow**

#### **DecisionTableView** (`model/DecisionTableView.java`)
```java
class DecisionTableView {
    List<String> columnLabels;    // Column headers (CONDITION_1, ACTION_1, etc.)
    List<String> templateLabels;  // Drools templates for each column
    List<RuleRow> rows;          // Data rows
}
```

#### **RuleRow** (`model/RuleRow.java`)
```java
class RuleRow {
    String name;           // Rule name (mandatory)
    List<Object> values;   // Values for each column (excluding name)
}
```

#### **Data Flow:**
1. Frontend loads Excel file list from backend
2. User selects file → backend parses Excel → returns DecisionTableView
3. User edits in grid → frontend maintains local DecisionTableView
4. User saves → frontend sends DecisionTableView to backend → backend writes Excel
5. User pushes → backend creates git branch, commits, pushes to remote

---

## 🔧 **Configuration & Environment**

### **Current Working Branch:** `Enhance_Intermediate_V1`
- Contains recent fixes for column management and rule validation
- Based on user's custom enhancements to the base application

### **Known Git Branches:**
- `main` - Base branch
- `Enhance_Intermediate_V1` - Current working branch
- `Intermediate_V1_Enhancements` - Previous enhancement branch

### **Environment Variables & Configuration:**
- Backend runs on hardcoded port 8080
- Frontend runs on hardcoded port 4200
- No environment-based configuration
- Base repository directory: `/home/ubuntu/repos/`

### **Dependencies:**
#### Backend (Maven)
- Spring Boot 2.x
- Apache POI (Excel processing)
- JGit (Git operations)
- Drools rule engine

#### Frontend (npm)
- Angular 15+
- Bootstrap (styling)
- RxJS (reactive programming)

---

## 🔄 **Typical User Workflows**

### **1. Edit Excel Rules**
1. Access frontend at http://localhost:4200
2. Select Excel file from file list
3. Edit rules in grid interface
4. Add/delete columns as needed
5. Save changes (validates rule names)
6. Optionally push to Git

### **2. Git Integration Workflow**
1. Configure repository (one-time setup)
2. Pull latest changes before editing
3. Make changes to rules
4. Save locally first
5. Push to Git (creates new branch)
6. Create PR (UI only - not implemented)

### **3. Add New Rules/Columns**
1. Open existing Excel file
2. Click "Add Column" to add CONDITION or ACTION
3. Fill in column template
4. Add rows with rule names and values
5. Save (validates all rule names are present)

---

## ⚠️ **Critical Issues to be Aware Of**

### **Data Loss Risks:**
1. **Silent filtering:** Empty rule names dropped without warning
2. **Git reset --hard:** Destroys uncommitted changes
3. **No backups:** No versioning before modifications
4. **Concurrent access:** No file locking for Excel files

### **Incomplete Features:**
1. **PR creation:** UI exists but backend doesn't implement
2. **Rule execution:** Backend works but no frontend UI
3. **Discard changes:** Not implemented
4. **Error recovery:** Limited rollback capabilities

### **Security Issues:**
1. **No authentication:** All endpoints open
2. **CORS wide open:** Allows any origin
3. **No input validation:** Directory traversal possible
4. **No rate limiting:** DoS vulnerability

---

## 🧪 **Testing & Development Notes**

### **How to Test Changes:**
1. **Column Operations:** Add/delete columns and verify data alignment
2. **Rule Validation:** Try saving with empty rule names (should fail)
3. **Git Operations:** Test pull/push workflows
4. **File Operations:** Open different Excel files

### **Common Development Patterns:**
- Frontend uses Angular reactive forms and observables
- Backend uses standard Spring Boot REST controllers
- Error handling via try-catch with printStackTrace (needs improvement)
- Configuration stored in memory (backend) and localStorage (frontend)

### **Known Working Excel Format:**
- Must have proper Drools decision table structure
- Headers: RuleTable, column labels, template labels
- Data rows with rule names and values
- Example: `rules/SampleRules.xlsx`

---

## 🔮 **Future Enhancement Opportunities**

### **High Priority:**
- Fix critical data loss and git safety issues
- Implement proper PR creation
- Add authentication and security
- Improve error handling and logging

### **Medium Priority:**
- Add rule execution UI
- Implement proper configuration persistence
- Add loading states and better UX
- Add comprehensive validation

### **Low Priority:**
- Add backup/versioning system
- Performance optimizations
- UI/UX improvements
- Add API documentation (Swagger)

---

## 📝 **Session Handoff Notes**

### **Current State (as of October 1, 2025 - 08:10 UTC):**
- ✅ Fixed column add/delete data misalignment bugs
- ✅ Added rule name validation (frontend + backend)
- ✅ Fixed NullPointerException in removeColumnAtPosition
- ✅ Fixed repeated notifications bug (duplicate column validation)
- ✅ Implemented folder selection feature in repository configuration
- ✅ Fixed critical git push path bug (separated repository root from folder paths)
- ✅ Added duplicate column error display in Add Column modal
- ✅ Fixed folder fetching to work with uncommitted changes
- ✅ All 6 critical bugs fixed (100% critical bug completion)
- ✅ 21 out of 29 total bugs fixed (72% overall completion rate)
- Comprehensive bug report documented in BUGS_AND_ISSUES.md
- Servers running: backend (port 8080), frontend (port 4200)

### **Recent Changes Made:**
1. `rules-grid.component.ts` - Fixed addColumn() and validateAndDeleteColumn(), fixed repeated notifications
2. `ExcelService.java` - Fixed removeColumnAtPosition() NPE and added rule name validation
3. `GitService.java` - Fixed git push path bug, now uses getRepositoryRootPath() for git operations
4. `RepositoryConfigService.java` - Added getRepositoryRootPath() method, separated path handling for git vs Excel operations
5. `repository-setup.component.ts` - Implemented folder selection with fetch folders functionality
6. `RepositoryConfigController.java` - Added /api/repository/folders endpoint for listing folders
7. All changes committed to local_to_git_bug_fixes branch and ready to push

### **Completed Tasks:**
1. ✅ Created branch `local_to_git_bug_fixes` from `Enhance_Intermediate_V1`
2. ✅ Fixed all 6 critical bugs from BUGS_AND_ISSUES.md
3. ✅ Removed git proxy dependencies - app now works with direct GitHub/GitLab URLs
4. ✅ Implemented folder selection feature
5. ✅ Fixed repeated notifications and git push path bugs
6. ✅ Ready to push to remote and create after_local_ui_update branch

### **Important Context:**
- User requested NO testing of changes (will test themselves)
- Working directory: `/home/ubuntu/repos/drools-app`
- Git authentication: Now supports direct GitHub/GitLab URLs (proxy removed)
- Current user: Sai-Kushal-Nerella-WL
- Configuration persistence: Saved to `drools-config.json` in root directory
- Repository directory: Configurable via `DROOLS_REPO_DIR` environment variable (defaults to `./repos/`)

---

This document provides complete context for future Devin sessions to understand and continue work on this repository effectively.
