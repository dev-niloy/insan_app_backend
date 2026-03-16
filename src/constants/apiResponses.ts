import { Response } from 'express';

export enum HttpResponses {
  OK = 200,
  CREATED = 201,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  INTERNAL_SERVER_ERROR = 500,
  ALREADY_EXIST = 409,
}

export const API_RESPONSES = {
  created: <T>(res: Response, data: T, message = 'Successfully Created!') => {
    return res.status(HttpResponses.CREATED).json({
      success: true,
      data,
      message,
    });
  },
  fetched: <T>(res: Response, data: T, message?: string) => {
    const payload: any = {
      success: true,
      data,
    };

    if (message !== undefined) {
      payload.message = message;
    }

    return res.status(HttpResponses.OK).json(payload);
  },
  updated: <T>(res: Response, data: T, message = 'Successfully Updated!') => {
    return res.status(HttpResponses.OK).json({
      success: true,
      data,
      message,
    });
  },
  deleted: <T>(res: Response, data: T, message = 'Successfully Deleted!') => {
    return res.status(HttpResponses.OK).json({
      success: true,
      data,
      message,
    });
  },
  badRequest: (res: Response, message: string = 'Invalid Request') => {
    return res.status(HttpResponses.BAD_REQUEST).json({
      success: false,
      message,
    });
  },
  unauthorized: (res: Response, message = 'Unauthorized request!') => {
    return res.status(HttpResponses.UNAUTHORIZED).json({
      success: false,
      message,
    });
  },
  forbidden: (
    res: Response,
    message = 'Access denied. Insufficient permissions!',
  ) => {
    return res.status(HttpResponses.FORBIDDEN).json({
      success: false,
      message,
    });
  },
  notFound: (res: Response, message = 'Resource Not Found!') => {
    return res.status(HttpResponses.NOT_FOUND).json({
      success: false,
      message,
    });
  },
  internalServerError: (
    res: Response,
    message = 'Unexpected server error. Please try again later.',
  ) => {
    const payload: any = {
      success: false,
      message,
    };
    return res.status(HttpResponses.INTERNAL_SERVER_ERROR).json(payload);
  },
};
