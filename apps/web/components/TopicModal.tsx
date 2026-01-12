import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Topic, PlaybackContent } from "@speed-code/shared";

interface TopicModalProps {
  topic: Topic | null;
  onClose: () => void;
}

export const TopicModal = ({ topic, onClose }: TopicModalProps) => {
  // Cast motion.div to any to avoid type errors with current framer-motion version
  const MotionDiv = motion.div as any;
  const [scriptText, setScriptText] = useState<string | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  useEffect(() => {
    if (topic?.playback_content?.script_json_url) {
      setIsLoadingScript(true);
      fetch(topic.playback_content.script_json_url)
        .then((res) => res.json())
        .then((data) => {
          setScriptText(data.text);
        })
        .catch((err) => {
          console.error("Failed to load script", err);
          setScriptText("Failed to load script.");
        })
        .finally(() => {
          setIsLoadingScript(false);
        });
    } else {
      setScriptText(null);
    }
  }, [topic?.playback_content?.script_json_url]);

  return (
    <AnimatePresence>
      {topic && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-white/20 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 pb-4 shrink-0 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                >
                  <X size={18} />
                </button>

                <div className="pr-8">
                  <h2 className="text-xl font-bold text-stone-900 leading-tight">
                    {topic.processed_input.title}
                  </h2>
                  {topic.processed_input.sender && (
                    <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-stone-100 rounded text-xs font-medium text-stone-600">
                      <span className="text-stone-400">From:</span>
                      {topic.processed_input.sender}
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="px-6 overflow-y-auto">
                <div className="space-y-4 pb-6">
                  {topic.playback_content?.page_snapshot_url && (
                    <div className="rounded-xl overflow-hidden border border-stone-200">
                      <img
                        src={topic.playback_content.page_snapshot_url}
                        alt="Page Snapshot"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 text-sm text-stone-600 leading-relaxed">
                    {topic.processed_input.content}
                  </div>

                  {topic.processed_input.extracted_link && (
                    <div>
                      <a
                        href={topic.processed_input.extracted_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Source Link
                      </a>
                    </div>
                  )}

                  {(scriptText || isLoadingScript) && (
                    <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                      <h3 className="text-sm font-semibold mb-2 text-stone-700">Generated Script</h3>
                      {isLoadingScript ? (
                        <p className="text-xs text-stone-400 animate-pulse">Loading script...</p>
                      ) : (
                        <p className="whitespace-pre-wrap font-mono text-xs text-stone-500">{scriptText}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 shrink-0 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
