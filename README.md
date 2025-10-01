# Drools Decision Table Manager

A web-based application for managing and editing Drools decision tables stored as Excel files in Git repositories.

## Features

- 📊 View and edit Drools decision tables (Excel format)
- 🔄 Git integration (pull/push operations)
- ➕ Add/delete columns dynamically
- ✏️ Edit rules inline
- 🔍 Repository configuration with validation
- 💾 Automatic configuration persistence

## Quick Start

### Prerequisites

- Java 11 or higher
- Maven 3.6+
- Node.js 14+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sai-Kushal-Nerella-WL/drools-app
cd drools-app
```

2. (Optional) Set custom repository directory:
```bash
export DROOLS_REPO_DIR=/path/to/your/repos/
```
If not set, repositories will be cloned to `./repos/` directory.

3. Install frontend dependencies:
```bash
cd drools-frontend
npm install
cd ..
```

### Running the Application

1. Start the backend (in one terminal):
```bash
cd drools-backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`

2. Start the frontend (in another terminal):
```bash
cd drools-frontend
npm start
```
Frontend runs on `http://localhost:4200`

3. Open your browser and navigate to `http://localhost:4200`

### Configuration

1. On first launch, configure your repository:
   - Enter repository URL: `https://github.com/username/repo-name`
   - Enter branch name (e.g., `main`)
   - Optionally provide a display name
   - Click "Configure Repository"

2. Configuration is saved to `drools-config.json` and persists across server restarts

## Architecture

### Backend (Spring Boot)
- **Port:** 8080
- **Framework:** Spring Boot with Maven
- **Excel Processing:** Apache POI
- **Git Operations:** JGit and ProcessBuilder

### Frontend (Angular)
- **Port:** 4200
- **Framework:** Angular 15+
- **Styling:** Custom CSS with modern design

## API Endpoints

### Repository Configuration
- `POST /api/repository-config/save` - Save repository configuration
- `GET /api/repository-config` - Get current configuration
- `GET /api/repository-config/is-configured` - Check if configured
- `POST /api/repository-config/clear` - Clear configuration

### File Operations
- `GET /api/sheets/list` - List all Excel files
- `GET /api/sheets/{fileName}` - Get decision table content
- `POST /api/sheets/{fileName}` - Save decision table

### Git Operations
- `POST /api/git/pull` - Pull latest changes from repository
- `POST /api/git/push` - Push changes to repository
- `GET /api/git/list-branches` - List remote branches

## Environment Variables

- `DROOLS_REPO_DIR` - Directory where Git repositories are cloned (default: `./repos/`)

## Configuration File

The application stores configuration in `drools-config.json`:
```json
{
  "repoUrl": "https://github.com/username/repo-name",
  "branch": "main",
  "displayName": "My Repository",
  "isConfigured": true
}
```

## Development

### Backend Development
```bash
cd drools-backend
mvn clean install
mvn spring-boot:run
```

### Frontend Development
```bash
cd drools-frontend
npm install
npm start
```

### Building for Production

Backend:
```bash
cd drools-backend
mvn clean package
java -jar target/drools-backend-0.0.1-SNAPSHOT.jar
```

Frontend:
```bash
cd drools-frontend
npm run build
# Deploy contents of dist/ directory
```

## Known Issues and Limitations

- See `BUGS_AND_ISSUES.md` for comprehensive bug report
- No authentication/authorization implemented
- CORS configured for development (allows all origins)
- Limited error recovery for git operations

## Recent Changes

### Version 2.0 (local_to_git_bug_fixes branch)
- ✅ Removed git proxy dependencies
- ✅ Added direct GitHub/GitLab URL support
- ✅ Implemented configuration persistence
- ✅ Fixed critical git operation bugs
- ✅ Added thread safety and file locking
- ✅ Improved error handling
- ✅ Fixed memory leaks in frontend
- ✅ Added comprehensive validation

See `BUGS_AND_ISSUES.md` for detailed list of fixes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license information here]

## Support

For issues and questions, please create an issue in the GitHub repository.
