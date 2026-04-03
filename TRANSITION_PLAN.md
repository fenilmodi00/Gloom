# Plan for Transitioning to Jest with React Native Testing Library

## Goals
- Shift from using Bun for tests to Jest with React Native Testing Library for a more reliable testing environment.
- Implement Mock Service Worker (MSW) to handle API mocking effectively, increasing test reliability and coverage.

## Step-by-Step Transition Plan

### 1. Remove Bun Dependencies
- Identify and remove any references to Bun in the project configuration and scripts.

### 2. Install Jest and React Native Testing Library
- **Commands**:
  ```bash
  npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
  ```

### 3. Configure Jest
- Create or update the `jest.config.js` as follows:
  ```javascript
  module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
      '^@react-native-async-storage/async-storage$': 'jest/async-storage-mock',
    },
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
    ],
  };
  ```

### 4. Setup File Configuration
- Create or modify `jest.setup.js`:
  ```javascript
  import '@testing-library/jest-native/extend-expect';
  import { server } from './mocks/server'; // MSW setup

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  ```

### 5. Implement Mock Service Worker (MSW)
- Install MSW:
  ```bash
  npm install msw --save-dev
  ```
- Create `mocks/handlers.js` with basic API request mocks.
- Create `mocks/server.js` to configure and set up MSW.

### 6. Update Tests to Use RTL
- Convert existing test cases to utilize `@testing-library/react-native` methods.
- Ensure that user interactions are simulated using RTL's `userEvent` API.

### 7. Conduct a Thorough Testing Audit
- Verify that:
  - Unit tests cover all business logic.
  - Component tests validate user interactions and states.
  - E2E tests exist for critical user journeys.

### 8. Update AGENTS.md Documentation
- Document all changes made during the transition, including commands and configuration details.

### 9. CI/CD Integration
- Set up CI using GitHub Actions or any other tool to automatically run tests on each push or merge requests.
  - Configure workflows to execute tests and ensure coverage thresholds are met.

---

## Conclusion
This transition plan aims to create a more reliable and standardized testing setup for the React Native application, improving overall code quality and user experience. Following these steps will ensure that the project remains maintainable and scalable moving forward.