import { X } from "lucide-react";

interface Topic {
    id: string;
    title: string;
    context: string;
    sender?: string;
}

interface TopicModalProps {
    topic: Topic | null;
    onClose: () => void;
}

export const TopicModal = ({ topic, onClose }: TopicModalProps) => {
    if (!topic) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-stone-100 animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-stone-100"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-stone-900 mb-2 pr-8">{topic.title}</h2>
                    {topic.sender && (
                        <div className="flex items-center gap-2 text-xs font-medium text-stone-500 bg-stone-50 px-2 py-1 rounded-md w-fit">
                            <span>From:</span>
                            <span className="text-stone-700">{topic.sender}</span>
                        </div>
                    )}
                </div>

                <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                        {topic.context}
                    </p>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
