import { ZodError, ZodIssue } from 'zod';
import { TErrorSources, TGenericErrorResponse } from '../types/error';

export const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources = err.issues.map((issue: ZodIssue) => {
    const path = issue?.path[issue.path.length - 1];
    const message = issue.message;
    return {
      path,
      message,
    };
  });

  const statusCode = 400;

  const errorMainMessage = err.issues[0].message;
  const requiredErrorMessage = errorSources
    .filter((error) => error.path !== 'permissions')
    .map((error) => {
      if (error.message === 'Required') {
        return `${error.path} is ${error.message}`;
      }
    })
    .join(', ');

  return {
    statusCode,
    message: 'Zod Validation Error',
    errorMessage: requiredErrorMessage
      ? requiredErrorMessage
      : errorMainMessage,
    errorDetails: errorSources,
  };
};
