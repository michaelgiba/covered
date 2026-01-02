import { useQuery } from "@tanstack/react-query";
import { fetchTopics } from "../api/topics";

export const useTopics = (baseUrl: string) => {
    return useQuery({
        queryKey: ["topics"],
        queryFn: () => fetchTopics(baseUrl),
        refetchInterval: 1000,
    });
};
