import type { TemplateDto } from "@workspace/shared"

import { api } from "./client"

export const templatesApi = {
  list: async (): Promise<TemplateDto[]> =>
    (await api.get<TemplateDto[]>("/templates")).data,
}
