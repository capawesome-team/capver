import { describe, expect, it } from 'vitest';
import { CliError, getMessageFromUnknownError } from './error.js';

describe('CliError', () => {
  it('should be an instance of Error', () => {
    const error = new CliError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CliError);
  });

  it('should have the correct name', () => {
    const error = new CliError('Test error');
    expect(error.name).toBe('CliError');
  });

  it('should have the correct message', () => {
    const message = 'This is a test error message';
    const error = new CliError(message);
    expect(error.message).toBe(message);
  });
});

describe('getMessageFromUnknownError', () => {
  it('should handle CliError correctly', () => {
    const message = 'This is a CLI error';
    const error = new CliError(message);
    expect(getMessageFromUnknownError(error)).toBe(message);
  });

  it('should handle regular Error', () => {
    const message = 'This is a regular error';
    const error = new Error(message);
    expect(getMessageFromUnknownError(error)).toBe(message);
  });

  it('should handle unknown error types', () => {
    expect(getMessageFromUnknownError('string error')).toBe('An unknown error has occurred.');
    expect(getMessageFromUnknownError(123)).toBe('An unknown error has occurred.');
    expect(getMessageFromUnknownError(null)).toBe('An unknown error has occurred.');
    expect(getMessageFromUnknownError(undefined)).toBe('An unknown error has occurred.');
  });
});