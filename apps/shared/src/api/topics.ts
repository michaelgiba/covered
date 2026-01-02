import { Topic } from "../types";

export const fetchTopics = async (baseUrl: string): Promise<Topic[]> => {
    const res = await fetch(`${baseUrl}/topics.json`, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error("Failed to fetch topics");
    }
    return res.json();
};
