import { NextResponse } from 'next/server';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  received?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export function apiSuccess<T = any>(
  data: T,
  message: string = 'Operasi berhasil',
  status: number = 200,
  pagination?: PaginationMeta,
  headers?: Record<string, string>
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function apiPaginated<T = any>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data berhasil diambil',
  headers?: Record<string, string>
) {
  const total_pages = Math.ceil(total / (limit || 1)) || 1;
  return apiSuccess(
    items,
    message,
    200,
    {
      page,
      limit,
      total,
      total_pages,
    },
    headers
  );
}

export function apiError(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status: number = 500,
  details?: ApiErrorDetail[],
  headers?: Record<string, string>
) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
