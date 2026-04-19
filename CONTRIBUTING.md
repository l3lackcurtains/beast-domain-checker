# Contributing to Beast Domain Checker

Thank you for your interest in contributing to Beast Domain Checker! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- Git
- Basic knowledge of TypeScript, Astro, and Puppeteer

### Fork and Clone

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/beast-domain-checker.git
   cd beast-domain-checker
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/l3lackcurtains/beast-domain-checker.git
   ```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:6006](http://localhost:6006)

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** - Help us fix issues
- **New features** - Add new functionality
- **Documentation** - Improve or add documentation
- **Tests** - Add or improve test coverage
- **UI/UX improvements** - Enhance user experience
- **Performance optimizations** - Make the app faster
- **Code refactoring** - Improve code quality

### Finding Issues to Work On

1. Check the [GitHub Issues](https://github.com/l3lackcurtains/beast-domain-checker/issues)
2. Look for issues labeled:
   - `good first issue` - Great for newcomers
   - `help wanted` - We need help with these
   - `bug` - Bug fixes needed
   - `enhancement` - New features

### Creating an Issue

Before creating a new issue:

1. Search existing issues to avoid duplicates
2. Use clear, descriptive titles
3. Provide detailed descriptions
4. Include steps to reproduce (for bugs)
5. Add screenshots if applicable

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make your changes:**
   - Write clean, readable code
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

4. **Test your changes:**
   ```bash
   # Run development server
   npm run dev
   
   # Build to ensure no errors
   npm run build
   
   # Test CLI if applicable
   npm run cli -- --help
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with..."
   ```

### Commit Message Guidelines

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add bulk domain export to CSV
fix: resolve Puppeteer timeout issue
docs: update deployment instructions
style: format code with prettier
refactor: simplify domain checking logic
test: add unit tests for CSV parser
chore: update dependencies
```

### Submitting the Pull Request

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request:**
   - Go to GitHub and create a new pull request
   - Fill out the PR template
   - Link to any related issues

3. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring
   - [ ] Other (please describe)

   ## Testing
   - [ ] Tested locally
   - [ ] Added/updated tests
   - [ ] All existing tests pass

   ## Screenshots (if applicable)
   Add screenshots for UI changes

   ## Related Issues
   Fixes #issue-number
   ```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable names

### Astro/Svelte Components

- Use descriptive component names
- Keep components small and focused
- Use proper prop typing
- Follow Astro best practices

### CSS/Tailwind

- Use Tailwind utility classes
- Keep styles consistent with existing code
- Use CSS variables for theming
- Avoid excessive custom CSS

### Code Formatting

We use Prettier for code formatting:

```bash
# Format code
npm run format

# Check formatting
npx prettier --check .
```

### Linting

```bash
# Run linter
npm run lint
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.file
```

### Writing Tests

- Write tests for new features
- Test edge cases
- Use descriptive test names
- Follow existing test patterns

## Reporting Issues

### Bug Reports

When reporting bugs:

1. **Use the bug report template**
2. **Include:**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)
   - Console errors

### Security Issues

**DO NOT** report security vulnerabilities publicly.

Instead, email: [security@example.com]

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Feature Requests

We welcome feature requests! Please:

1. Check if already requested
2. Use the feature request template
3. Explain the problem you're solving
4. Describe your proposed solution
5. Include use cases

## Development Tips

### Project Structure

```
beast-domain-checker/
├── src/
│   ├── lib/           # Core logic
│   ├── pages/         # Astro pages
│   └── styles/        # CSS styles
├── public/            # Static assets
├── scripts/           # Build scripts
└── tests/             # Test files
```

### Key Files

- `src/lib/domainChecker.ts` - Puppeteer automation
- `src/lib/csvParser.ts` - CSV parsing logic
- `src/pages/index.astro` - Main UI
- `src/pages/api/check-domains.ts` - Domain checking API
- `cli.js` - CLI interface

### Debugging

1. **Use browser DevTools:**
   - Open browser console
   - Check network requests
   - Inspect elements

### Common Issues

#### Puppeteer Errors

If Puppeteer fails to launch:

```bash
# Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get install -y chromium-browser

# Or use puppeteer's bundled Chrome
npx puppeteer browsers install chrome
```

#### Port Already in Use

Change the port:

```bash
PORT=3000 npm run dev
```

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project website (if applicable)

## Questions?

If you have questions:

1. Check existing documentation
2. Search GitHub issues
3. Create a new discussion
4. Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Beast Domain Checker!**