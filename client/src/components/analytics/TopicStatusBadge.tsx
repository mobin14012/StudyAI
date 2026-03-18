import { Badge } from "@/components/ui/badge";

interface TopicStatusBadgeProps {
  isWeak: boolean;
  isMastered: boolean;
}

export function TopicStatusBadge({ isWeak, isMastered }: TopicStatusBadgeProps) {
  if (isMastered) {
    return <Badge className="bg-green-500 hover:bg-green-600">Mastered</Badge>;
  }
  if (isWeak) {
    return <Badge variant="destructive">Weak</Badge>;
  }
  return <Badge variant="secondary">Normal</Badge>;
}
