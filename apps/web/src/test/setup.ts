// Test setup file
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import React from 'react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock framer-motion to avoid rendering issues and network calls
vi.mock('framer-motion', () => {
  const createMotionComponent = (element: string) => {
    return ({ children, initial, animate, exit, transition, whileHover, whileTap, layoutId, ...props }: any) => {
      // Filter out framer-motion specific props
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.exit;
      delete cleanProps.transition;
      delete cleanProps.whileHover;
      delete cleanProps.whileTap;
      delete cleanProps.layoutId;
      delete cleanProps.variants;
      delete cleanProps.custom;

      return React.createElement(element, cleanProps, children);
    };
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      section: createMotionComponent('section'),
      form: createMotionComponent('form'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Suppress console errors/warnings in tests (optional - shows real issues)
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn((...args) => {
    // Filter out known React warnings
    const message = args[0]?.toString() || '';
    if (
      !message.includes('Warning: ReactDOM.render') &&
      !message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      originalError(...args);
    }
  });
  
  console.warn = vi.fn((...args) => {
    const message = args[0]?.toString() || '';
    // Only show non-test-related warnings
    if (!message.includes('test-')) {
      originalWarn(...args);
    }
  });
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// jest-axe setup for accessibility testing
import 'jest-axe/extend-expect';
