"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFinancialDataAsString } from "@/lib/mock-data";
import {
  scenarioPlanning,
  type ScenarioPlanningOutput,
} from "@/ai/flows/scenario-planning";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  userGoals: z
    .string()
    .min(10, { message: "Please describe your goals in a bit more detail." }),
  query: z
    .string()
    .min(10, { message: "Please ask a specific question for the projection." }),
});

export default function ScenarioPlanningPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScenarioPlanningOutput | null>(null);
  const [language, setLanguage] = useState("English");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userGoals: "",
      query: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await scenarioPlanning({
        ...values,
        financialData: getFinancialDataAsString(),
        language: language,
      });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Plan Your Financial Future</CardTitle>
            <CardDescription>
              Describe your goals to generate a projection in your chosen
              language.
            </CardDescription>
          </div>
          <Tabs
            defaultValue="English"
            onValueChange={setLanguage}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="English">English</TabsTrigger>
              <TabsTrigger value="Telugu">తెలుగు</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="userGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Financial Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., I want to retire at 60 with a monthly income of ₹1L, and buy a house worth ₹1 Cr in 5 years."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Specific Question</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Can I afford a ₹50L home loan right now?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Projection
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Financial Projection</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-card-foreground">
              {result.projection
                .split("\n")
                .map((line, i) => <p key={i}>{line}</p>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Explanation & Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-card-foreground">
              {result.explanation
                .split("\n")
                .map((line, i) => <p key={i}>{line}</p>)}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
