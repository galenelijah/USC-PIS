# Contributing to USC-PIS

Thank you for your interest in contributing to USC-PIS! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a respectful and inclusive environment.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/USC-PIS.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Follow the setup instructions in [docs/setup/README.md](docs/setup/README.md)

## Development Workflow

### 1. Branch Naming

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`
- Refactoring: `refactor/description`

### 2. Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

### 3. Code Style

#### Python
- Follow PEP 8
- Use Black for formatting
- Maximum line length: 88 characters
- Use type hints where possible
- Document functions and classes

#### JavaScript/TypeScript
- Use ESLint with provided configuration
- Use Prettier for formatting
- Follow React best practices
- Document components and functions

### 4. Testing

- Write tests for new features
- Maintain or improve code coverage
- Run the test suite before submitting PR:
  ```bash
  # Backend tests
  python manage.py test
  
  # Frontend tests
  npm test
  ```

### 5. Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update the changelog
5. Submit PR with clear description:
   - What changes were made
   - Why changes were needed
   - How to test the changes
   - Screenshots (if UI changes)

### 6. Review Process

1. Maintainers will review your PR
2. Address review comments
3. Update PR as needed
4. Once approved, maintainers will merge

## Project Structure

```
USC-PIS/
├── backend/          # Django backend
│   ├── api/         # API endpoints
│   ├── core/        # Core functionality
│   └── tests/       # Backend tests
├── frontend/        # React frontend
│   ├── src/         # Source code
│   └── tests/       # Frontend tests
├── docs/            # Documentation
└── scripts/         # Development scripts
```

## Common Tasks

### Adding New API Endpoint

1. Create endpoint in appropriate API module
2. Add tests
3. Update API documentation
4. Update frontend service if needed

### Adding New Feature

1. Discuss in issues first
2. Create feature branch
3. Implement backend changes
4. Implement frontend changes
5. Add tests
6. Update documentation

### Fixing Bugs

1. Create issue if not exists
2. Add failing test
3. Fix bug
4. Verify test passes

## Getting Help

- Check existing issues
- Join our Discord server
- Email: dev-support@usc-pis.com

## License

By contributing, you agree that your contributions will be licensed under the project's license. 