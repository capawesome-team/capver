import { ZodError } from 'zod';

export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

export const getMessageFromUnknownError = (error: unknown): string => {
  let message = 'An unknown error has occurred.';
  if (error instanceof CliError) {
    message = error.message;
  } else if (error instanceof ZodError) {
    message = getErrorMessageFromZodError(error);
  } else if (error instanceof Error) {
    message = error.message;
  }
  return message;
};

const getErrorMessageFromZodError = (error: ZodError): string => {
  let message: string = 'An unknown validation error has occurred. Please check your input.';
  const firstIssue = error.issues[0];
  if (firstIssue) {
    message = firstIssue.message;
  }
  return message;
};
