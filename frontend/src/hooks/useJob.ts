import { useQuery } from "@tanstack/react-query";
import { getJob } from "../api/client";

/** Polls a job every 2s until it reaches a terminal state. */
export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id as string),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
}
