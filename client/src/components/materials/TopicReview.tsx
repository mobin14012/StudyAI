import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Topic } from "@/types";

interface TopicReviewProps {
  topics: Topic[];
  onSave: (topics: Topic[]) => void;
  isSaving?: boolean;
}

export function TopicReview({
  topics: initialTopics,
  onSave,
  isSaving = false,
}: TopicReviewProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);

  function handleToggle(index: number) {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, selected: !t.selected } : t
      )
    );
  }

  function handleSelectAll() {
    setTopics((prev) => prev.map((t) => ({ ...t, selected: true })));
  }

  function handleDeselectAll() {
    setTopics((prev) => prev.map((t) => ({ ...t, selected: false })));
  }

  const selectedCount = topics.filter((t) => t.selected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Detected Topics</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} of {topics.length} topics selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={isSaving}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={isSaving}
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {topics.map((topic, index) => (
          <label
            key={topic.name}
            className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={topic.selected}
              onCheckedChange={() => handleToggle(index)}
              disabled={isSaving}
            />
            <span className="text-sm font-medium flex-1">
              {topic.name}
            </span>
            <Badge variant={topic.selected ? "default" : "secondary"}>
              {topic.selected ? "Selected" : "Skipped"}
            </Badge>
          </label>
        ))}
      </div>

      <Button
        onClick={() => onSave(topics)}
        disabled={isSaving || selectedCount === 0}
        className="w-full"
      >
        {isSaving ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Saving...</span>
          </>
        ) : (
          `Save Selections (${selectedCount} topics)`
        )}
      </Button>
    </div>
  );
}
