import type { SchemaDto, SchemaInput } from "@workspace/shared"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import toast from "react-hot-toast"

import { schemasApi, type SchemasListParams } from "@/api/schemasApi"

export const schemaKeys = {
  all: ["schemas"] as const,
  lists: () => [...schemaKeys.all, "list"] as const,
  list: (params: SchemasListParams) => [...schemaKeys.lists(), params] as const,
  detail: (id: string) => [...schemaKeys.all, "detail", id] as const,
}

export function useSchemas(params: SchemasListParams = {}) {
  return useQuery({
    queryKey: schemaKeys.list(params),
    queryFn: () => schemasApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useSchema(id: string | undefined) {
  return useQuery({
    queryKey: schemaKeys.detail(id ?? "new"),
    queryFn: () => schemasApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SchemaInput) => schemasApi.create(input),
    onSuccess: (created) => {
      qc.setQueryData(schemaKeys.detail(created.id), created)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: schemaKeys.lists() }),
  })
}

/**
 * Optimistic update: the detail cache is patched immediately (onMutate)
 * so the UI shows the saved state without waiting for the server; on error
 * the previous snapshot is restored.
 */
export function useUpdateSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SchemaInput }) =>
      schemasApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: schemaKeys.detail(id) })
      const previous = qc.getQueryData<SchemaDto>(schemaKeys.detail(id))
      if (previous) {
        qc.setQueryData<SchemaDto>(schemaKeys.detail(id), {
          ...previous,
          ...input,
          description: input.description ?? null,
          updatedAt: Date.now(),
        })
      }
      return { previous }
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(schemaKeys.detail(id), context.previous)
      }
    },
    onSettled: (_data, _err, { id }) => {
      void qc.invalidateQueries({ queryKey: schemaKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: schemaKeys.lists() })
    },
  })
}

/** Optimistic delete: the card disappears from every cached list at once. */
export function useDeleteSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => schemasApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: schemaKeys.lists() })
      const snapshots = qc.getQueriesData<SchemaDto[]>({
        queryKey: schemaKeys.lists(),
      })
      for (const [key, data] of snapshots) {
        if (data) {
          qc.setQueryData(
            key,
            data.filter((s) => s.id !== id),
          )
        }
      }
      return { snapshots }
    },
    onError: (err, _id, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        qc.setQueryData(key, data)
      }
      toast.error(err.message)
    },
    onSuccess: () => toast.success("Esquema eliminado"),
    onSettled: () => qc.invalidateQueries({ queryKey: schemaKeys.lists() }),
  })
}

export function useDuplicateSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => schemasApi.duplicate(id),
    onSuccess: (copy) => {
      qc.setQueryData(schemaKeys.detail(copy.id), copy)
      toast.success(`Duplicado como «${copy.name}»`)
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => qc.invalidateQueries({ queryKey: schemaKeys.lists() }),
  })
}
