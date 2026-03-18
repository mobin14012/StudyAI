import { useState, useRef, useEffect } from "react";
import { useMaterials } from "@/hooks/use-materials";
import { useTutor } from "@/hooks/use-tutor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Bot, User, BookOpen, Trash2 } from "lucide-react";

export function TutorPage() {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: materials, isLoading: loadingMaterials } = useMaterials();
  const { history, sendMessage, isLoading, clearHistory } = useTutor(selectedMaterialId);

  const readyMaterials = materials?.data.filter((m) => m.status === "ready") || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedMaterialId || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 md:h-6 md:w-6" />
          AI Tutor
        </h2>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="w-full sm:w-auto min-h-10">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Material Selection */}
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Select Study Material
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loadingMaterials ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : readyMaterials.length === 0 ? (
            <p className="text-muted-foreground text-sm">No materials available. Upload some study materials first.</p>
          ) : (
            <Select value={selectedMaterialId} onValueChange={(val) => setSelectedMaterialId(val || "")}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Choose a material to discuss" />
              </SelectTrigger>
              <SelectContent>
                {readyMaterials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="truncate">{m.filename}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      {selectedMaterialId && (
        <Card className="flex flex-col h-[calc(100vh-20rem)] md:h-[500px] min-h-[300px]">
          <CardContent className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center px-4">
                <p>Ask me anything about your study material!</p>
              </div>
            ) : (
              history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 md:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm md:text-base break-words">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-3 md:p-4 border-t bg-card">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="min-h-11"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} className="min-h-11 min-w-11 px-3">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
