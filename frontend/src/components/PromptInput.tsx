"use client";

import { useState } from "react";
import { writeContract } from "@/lib/contract";

interface PromptInputProps {
  roomId: number;
  hasSubmitted: boolean;
  onSubmitted: () => void;
}

export function PromptInput({
  roomId,
  hasSubmitted,
  onSubmitted,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await writeContract("submit_prompt", [BigInt(roomId), prompt.trim()]);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit prompt");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-green-600 font-medium">
          Prompt submitted! Waiting for other players...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Your Prompt
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Write your best prompt here..."
        maxLength={1000}
        rows={4}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          {prompt.length}/1000 characters
        </span>
        {error && <span className="text-xs text-red-500">{error}</span>}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !prompt.trim()}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
        >
          {isSubmitting ? "Submitting..." : "Submit Prompt"}
        </button>
      </div>
    </div>
  );
}
