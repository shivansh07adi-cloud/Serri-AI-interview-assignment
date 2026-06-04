import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const BASE = '/api/contacts';

// ── Fetch paginated / searched list ──────────────────────────────────
export function useContacts({ search = '', page = 1, limit = 50 } = {}) {
  return useQuery({
    queryKey: ['contacts', search, page, limit],
    queryFn: async () => {
      const { data } = await axios.get(BASE, {
        params: { search, page, limit },
      });
      return data;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });
}

// ── Fetch single contact ──────────────────────────────────────────────
export function useContact(id) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data } = await axios.get(`${BASE}/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── Create ────────────────────────────────────────────────────────────
export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => axios.post(BASE, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// ── Update ────────────────────────────────────────────────────────────
export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      axios.patch(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', id] });
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────
export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axios.delete(`${BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// ── Import CSV ────────────────────────────────────────────────────────
export function useImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('file', file);
      return axios
        .post(`${BASE}/import`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            // You can track progress here if needed
          },
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}
