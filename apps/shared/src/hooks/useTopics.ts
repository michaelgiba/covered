import { useQuery } from "@tanstack/react-query";
import { fetchTopics } from "../api/topics";

export const useTopics = (baseUrl: string) => {
    return useQuery({
        queryKey: ["topics"],
        queryFn: () => fetchTopics(baseUrl),
        refetchInterval: 1000,
        select: (data) => {
            // Deduplicate topics
            const uniqueTopics = data.filter((topic, index, self) =>
                index === self.findIndex((t) => t.id === topic.id)
            );
            // Sort by timestamp (newest first - reverse chronological)
            return uniqueTopics.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
        }
    });
};
