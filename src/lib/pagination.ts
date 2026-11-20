export interface ListQuery {
  page: number;
  pageSize: number;
  busca?: string;
  status?: string;
  estadoId?: number;
  cidadeId?: number;
  [key: string]: string | number | undefined;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function parseListQuery(request: Request): ListQuery {
  const params = new URL(request.url).searchParams;
  const parsedPage = Number(params.get("page") ?? 1);
  const parsedPageSize = Number(params.get("pageSize") ?? 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize =
    Number.isInteger(parsedPageSize) && parsedPageSize > 0
      ? Math.min(parsedPageSize, 100)
      : 10;

  const query: ListQuery = { page, pageSize };
  for (const [key, value] of params.entries()) {
    if (key === "page" || key === "pageSize") continue;
    if (key === "estadoId" || key === "cidadeId") {
      const id = Number(value);
      if (Number.isInteger(id) && id > 0) query[key] = id;
    } else if (value.trim()) {
      query[key] = value.trim();
    }
  }
  return query;
}

export async function paginate<T, R>(options: {
  query: ListQuery;
  count: () => Promise<number>;
  findMany: (pagination: { skip: number; take: number }) => Promise<T[]>;
  map: (item: T) => R;
}): Promise<PaginatedResult<R>> {
  const [total, items] = await Promise.all([
    options.count(),
    options.findMany({
      skip: (options.query.page - 1) * options.query.pageSize,
      take: options.query.pageSize,
    }),
  ]);
  return {
    data: items.map(options.map),
    pagination: {
      page: options.query.page,
      pageSize: options.query.pageSize,
      total,
      totalPages: Math.ceil(total / options.query.pageSize),
    },
  };
}
