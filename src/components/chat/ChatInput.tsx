import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onCancel, isLoading, isStreaming, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  // Ref-based guard against double-fires (Enter + click, rapid clicks).
  // isLoading flips async; a ref is the only way to reject the second call synchronously.
  const sendingRef = useRef(false);

  // Release the guard when the parent finishes processing.
  useEffect(() => {
    if (!isLoading && !isStreaming) sendingRef.current = false;
  }, [isLoading, isStreaming]);

  const handleSend = () => {
    if (sendingRef.current || isLoading || !input.trim()) return;
    sendingRef.current = true;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type your message...'}
        className="min-h-[44px] max-h-[120px] resize-none rounded-full px-4 py-3 text-sm"
        rows={1}
        disabled={isLoading}
      />
      {isStreaming ? (
        <Button
          size="icon"
          variant="destructive"
          onClick={onCancel}
          className="h-10 w-10 rounded-full flex-shrink-0"
        >
          <Square className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="h-10 w-10 rounded-full flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
