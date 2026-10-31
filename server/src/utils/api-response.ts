export interface ApiSuccess<TData, TMeta = never> {
  data: TData;
  meta?: TMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function success<TData>(data: TData): ApiSuccess<TData> {
  return { data };
}
