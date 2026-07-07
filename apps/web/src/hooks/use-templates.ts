import { useQuery } from "@tanstack/react-query"

import { templatesApi } from "@/api/templatesApi"

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: templatesApi.list,
    staleTime: 5 * 60 * 1000,
  })
}
