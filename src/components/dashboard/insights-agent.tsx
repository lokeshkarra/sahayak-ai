"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader, Bot } from "lucide-react";
import { getFinancialInsights } from "@/ai/flows/financial-insights";
import { getFinancialDataAsString } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function InsightsAgent() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setInsight("");
    try {
      const response = await getFinancialInsights({
        question: query,
        financialData: getFinancialDataAsString(),
      });
      setInsight(response.insight);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to get insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>AI Financial Insights</CardTitle>
        <CardDescription>Ask a question about your finances.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., How's my net worth growing?"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !query}>
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Get Insight</span>
          </Button>
        </form>
        {insight && (
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>Personal Chanakya's Insight</AlertTitle>
            <AlertDescription className="prose prose-sm max-w-none">
              {insight.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
