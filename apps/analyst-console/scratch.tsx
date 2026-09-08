import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';

export function UsageMeter() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: usage, isLoading } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/usage');
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-end mb-2">
      {isOpen && (
        <div className="mb-2 p-3 bg-muted border border-border rounded-lg text-xs font-mono shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="font-semibold border-b border-border/50 pb-1 mb-1 text-primary">Session Usage (24h)</div>
          {isLoading || !usage ? (
            <div className="text-muted-foreground">Usage tracking initializing...</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>Requests: {usage.last24h}</div>
              <div>Tokens: {usage.totalTokens.toLocaleString()}</div>
              <div>Input: {usage.totalInputTokens.toLocaleString()}</div>
              <div>Output: {usage.totalOutputTokens.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 bg-muted/50 rounded-md border border-border/50"
      >
        <Activity className="w-3 h-3" />
        Usage
      </button>
    </div>
  );
}
