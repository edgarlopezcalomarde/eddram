import type { SchemaDto, SchemaInput, SchemaSort } from "@workspace/shared"

import { api } from "./client"

export interface SchemasListParams {
  search?: string
  sort?: SchemaSort
}

export const schemasApi = {
  list: async (params: SchemasListParams = {}): Promise<SchemaDto[]> =>
    (await api.get<SchemaDto[]>("/schemas", { params })).data,

  get: async (id: string): Promise<SchemaDto> =>
    (await api.get<SchemaDto>(`/schemas/${id}`)).data,

  create: async (input: SchemaInput): Promise<SchemaDto> =>
    (await api.post<SchemaDto>("/schemas", input)).data,

  update: async (id: string, input: SchemaInput): Promise<SchemaDto> =>
    (await api.put<SchemaDto>(`/schemas/${id}`, input)).data,

  duplicate: async (id: string): Promise<SchemaDto> =>
    (await api.post<SchemaDto>(`/schemas/${id}/duplicate`)).data,

  remove: async (id: string): Promise<void> => {
    await api.delete(`/schemas/${id}`)
  },
}
