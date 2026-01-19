import { Topic } from "../types";

export const fetchTopics = async (baseUrl: string): Promise<Topic[]> => {
    // Ensure baseUrl doesn't have trailing slash if empty string
    const url = baseUrl ? `${baseUrl}/topics` : '/topics';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error("Failed to fetch topics");
    }
    const data = await res.json();
    return data.topics;
};
