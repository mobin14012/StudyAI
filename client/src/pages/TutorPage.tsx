import { useState } from "react";
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
  const { data: materials, isLoading: loadingMaterials } = useMaterials();
  const { history, sendMessage, isLoading, clearHistory } = useTutor(selectedMaterialId);

  const readyMaterials = materials?.data.filter((m) => m.status === "ready") || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedMaterialId || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          AI Tutor
        </h2>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Material Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Select Study Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMaterials ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : readyMaterials.length === 0 ? (
            <p className="text-muted-foreground">No materials available. Upload some study materials first.</p>
          ) : (
            <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a material to discuss" />
              </SelectTrigger>
              <SelectContent>
                {readyMaterials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      {selectedMaterialId && (
        <Card className="h-[500px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Ask me anything about your study material!</p>
              </div>
            ) : (
              history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
