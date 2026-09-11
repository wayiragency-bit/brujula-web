import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated, Product, ProductFormValues, ProductType } from '@/lib/types';

export interface ProductsFilters {
  q?: string;
  type?: ProductType;
  category?: string;
  active?: boolean;
  page: number;
  limit: number;
}

function buildQuery(filters: ProductsFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.active !== undefined) params.set('active', String(filters.active));
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params.toString();
}

export function useProducts(filters: ProductsFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.get<Paginated<Product>>(`/products?${buildQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: () => api.get<string[]>('/products/categories'),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductFormValues) => api.post<Product>('/products', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<ProductFormValues>) => api.patch<Product>(`/products/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (products: ProductFormValues[]) => api.post<{ imported: number }>('/products/import', { products }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
