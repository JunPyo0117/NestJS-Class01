// Mock for uuid package in E2E tests
module.exports = {
  v4: jest.fn(() => 'mock-uuid-v4'),
  v1: jest.fn(() => 'mock-uuid-v1'),
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
};
