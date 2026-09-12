import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CatalogAccommodationDetail, CatalogDestination, CatalogHotelDetail, CatalogHotelListItem, CatalogServiceItem,
} from '@/lib/catalog-types';

// --- Destinations ---------------------------------------------------------------------------

export function useCatalogDestinations() {
  return useQuery({
    queryKey: ['catalog', 'destinations'],
    queryFn: () => api.get<CatalogDestination[]>('/catalog/destinations'),
  });
}

export function useCreateDestination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; country: string }) => api.post<CatalogDestination>('/catalog/destinations', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'destinations'] }),
  });
}

export function useUpdateDestination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...values }: { id: string; name?: string; country?: string; active?: boolean }) =>
      api.patch<CatalogDestination>(`/catalog/destinations/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'destinations'] }),
  });
}

// --- Hotels ----------------------------------------------------------------------------------

export interface HotelFilters { destinationId?: string; active?: boolean }

export function useCatalogHotels(filters: HotelFilters = {}) {
  const params = new URLSearchParams();
  if (filters.destinationId) params.set('destinationId', filters.destinationId);
  if (filters.active !== undefined) params.set('active', String(filters.active));
  const qs = params.toString();
  return useQuery({
    queryKey: ['catalog', 'hotels', filters],
    queryFn: () => api.get<CatalogHotelListItem[]>(`/catalog/hotels${qs ? `?${qs}` : ''}`),
  });
}

export function useCatalogHotel(id: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'hotels', id],
    queryFn: () => api.get<CatalogHotelDetail>(`/catalog/hotels/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateHotel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { destinationId: string; name: string; description?: string }) =>
      api.post<CatalogHotelListItem>('/catalog/hotels', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels'] }),
  });
}

export function useUpdateHotel(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { destinationId?: string; name?: string; description?: string; active?: boolean }) =>
      api.patch<CatalogHotelListItem>(`/catalog/hotels/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', id] });
    },
  });
}

export function useAddHotelImage(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { url: string; isPrimary?: boolean }) => api.post(`/catalog/hotels/${hotelId}/images`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', hotelId] }),
  });
}

export function useRemoveHotelImage(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => api.delete(`/catalog/hotels/${hotelId}/images/${imageId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', hotelId] }),
  });
}

export function useSetPrimaryHotelImage(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => api.patch(`/catalog/hotels/${hotelId}/images/${imageId}/primary`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', hotelId] }),
  });
}

export function useAttachHotelService(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => api.post(`/catalog/hotels/${hotelId}/services`, { serviceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', hotelId] }),
  });
}

export function useDetachHotelService(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => api.delete(`/catalog/hotels/${hotelId}/services/${serviceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', hotelId] }),
  });
}

// --- Accommodations ----------------------------------------------------------------------------

export function useCatalogAccommodation(id: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'accommodations', id],
    queryFn: () => api.get<CatalogAccommodationDetail>(`/catalog/accommodations/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateAccommodation(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; capacityAdults?: number; capacityChildren?: number; bedConfiguration?: string; description?: string }) =>
      api.post('/catalog/accommodations', { ...values, hotelId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'hotels', hotelId] }),
  });
}

export function useUpdateAccommodation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      name?: string; capacityAdults?: number; capacityChildren?: number; bedConfiguration?: string; description?: string; active?: boolean;
    }) => api.patch(`/catalog/accommodations/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'accommodations', id] }),
  });
}

export function useAddAccommodationImage(accommodationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { url: string; isPrimary?: boolean }) => api.post(`/catalog/accommodations/${accommodationId}/images`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'accommodations', accommodationId] }),
  });
}

export function useRemoveAccommodationImage(accommodationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => api.delete(`/catalog/accommodations/${accommodationId}/images/${imageId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'accommodations', accommodationId] }),
  });
}

export function useSetPrimaryAccommodationImage(accommodationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => api.patch(`/catalog/accommodations/${accommodationId}/images/${imageId}/primary`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'accommodations', accommodationId] }),
  });
}

export function useAttachAccommodationService(accommodationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => api.post(`/catalog/accommodations/${accommodationId}/services`, { serviceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'accommodations', accommodationId] }),
  });
}

export function useDetachAccommodationService(accommodationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => api.delete(`/catalog/accommodations/${accommodationId}/services/${serviceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'accommodations', accommodationId] }),
  });
}

// --- Services ---------------------------------------------------------------------------------

export function useCatalogServices() {
  return useQuery({
    queryKey: ['catalog', 'services'],
    queryFn: () => api.get<CatalogServiceItem[]>('/catalog/services'),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; description?: string }) => api.post<CatalogServiceItem>('/catalog/services', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'services'] }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...values }: { id: string; name?: string; description?: string; active?: boolean }) =>
      api.patch<CatalogServiceItem>(`/catalog/services/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'services'] }),
  });
}
