import { useState, useCallback } from "react";
import { Send, Loader2, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IntakeResult {
  status: "collecting" | "complete";
  filter_json?: Record<string, unknown>;
  next_questions?: string[];
  summary?: string;
}

interface RentalsIntakeWizardProps {
  onComplete: (filterJson: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function RentalsIntakeWizard({ onComplete, onCancel }: RentalsIntakeWizardProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI rental assistant. Tell me about your ideal apartment in Medellín - things like your budget, preferred neighborhoods, number of bedrooms, or any must-have amenities.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectedCriteria, setCollectedCriteria] = useState<Record<string, unknown>>({});

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        "https://zkwcbyxiwklihegjhuql.supabase.co/functions/v1/rentals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            action: "intake",
            user_message: userMessage,
            context: {
              collected_criteria: collectedCriteria,
              message_history: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process request");
      }

      const result: IntakeResult = await response.json();

      if (result.status === "complete" && result.filter_json) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.summary || "Great! I have all the information I need. Let me search for apartments matching your criteria...",
          },
        ]);
        onComplete(result.filter_json);
      } else {
        // Still collecting criteria
        const assistantMessage = result.next_questions?.join("\n\n") || 
          "Could you tell me more about what you're looking for?";
        
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantMessage },
        ]);
        
        if (result.filter_json) {
          setCollectedCriteria((prev) => ({ ...prev, ...result.filter_json }));
        }
      }
    } catch (error) {
      console.error("Intake error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Could you please try again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, collectedCriteria, onComplete]);

  const quickPrompts = [
    "2BR apartment in El Poblado under $1500/month",
    "Pet-friendly with fast WiFi",
    "Furnished studio near Laureles",
    "3+ bedrooms for remote work",
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Rental Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Collected Criteria */}
        {Object.keys(collectedCriteria).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(collectedCriteria).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your ideal apartment..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Cancel */}
        {onCancel && (
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Skip AI Assistant
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
