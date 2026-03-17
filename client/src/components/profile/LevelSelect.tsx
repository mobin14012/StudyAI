import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LevelSelectProps {
  value: "junior" | "senior";
  onValueChange: (value: "junior" | "senior") => void;
  disabled?: boolean;
}

export function LevelSelect({ value, onValueChange, disabled }: LevelSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => { if (v) onValueChange(v); }} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select level" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="junior">Junior</SelectItem>
        <SelectItem value="senior">Senior</SelectItem>
      </SelectContent>
    </Select>
  );
}
