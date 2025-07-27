"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added for redirection
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
import {
  scenarioPlanning,
  type ScenarioPlanningOutput,
} from "@/ai/flows/scenario-planning";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { McpClient } from "@/services/mcp-client"; // Import McpClient
// --- TYPE DEFINITIONS FOR FINANCIAL DATA ---
// You should move these interfaces to a shared types file (e.g., @/types/financial.ts) if used elsewhere.

interface NetWorthData {
  totalNetWorthValue: { units: number };
  assetValues: { netWorthAttribute: string; value: { units: number } }[];
  liabilityValues: { netWorthAttribute: string; value: { units: number } }[];
  accountDetailsBulkResponse?: {
    accountDetailsMap: {
      [key: string]: {
        accountDetails: {
          fipMeta: { displayName: string };
          accInstrumentType: string;
          maskedAccountNumber: string;
          depositSummary?: { currentBalance?: { units: number } };
          equitySummary?: { currentValue?: { units: number } };
        };
      };
    };
  };
}

interface BankTransactionsData {
  txns: [number, string, string, number][];
}

interface CreditReportData {
  score?: { bureauScore?: number };
  creditAccount?: {
    creditAccountDetails?: {
      subscriberName: string;
      accountType: string;
      currentBalance: number;
      amountPastDue: number;
    }[];
  };
}

interface EPFData {
  overall_pf_balance?: { current_pf_balance?: number };
  est_details?: { est_name: string; pf_balance: { net_balance: number } }[];
}

interface FinancialDataForLLM {
  netWorth: NetWorthData;
  bankTransactions: BankTransactionsData[];
  creditReport: CreditReportData;
  epfDetails: EPFData;
}

const formSchema = z.object({
  userGoals: z
    .string()
    .min(10, { message: "Please describe your goals in a bit more detail." }),
  query: z
    .string()
    .min(10, { message: "Please ask a specific question for the projection." }),
});

export default function ScenarioPlanningPage() {
  const [isLoadingForm, setIsLoadingForm] = useState(false); // Renamed to avoid clash
  const [isLoadingData, setIsLoadingData] = useState(true); // New state for data loading
  const [error, setError] = useState(""); // New state for data fetching errors
  const [financialData, setFinancialData] = useState<FinancialDataForLLM | null>(null);
  const [result, setResult] = useState<ScenarioPlanningOutput | null>(null);
  const [language, setLanguage] = useState("English");
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userGoals: "",
      query: "",
    },
  });

  // --- Data Fetching Logic (Copied and adapted from app/page.tsx) ---
  useEffect(() => {
    const user = sessionStorage.getItem("mcp-user");
    if (!user) {
      router.push("/"); // Redirect to login page if no user in session
      return;
    }

    const fetchAndSetFinancialData = async () => {
      setIsLoadingData(true);
      setError("");
      try {
        const mcpClient = new McpClient();

        const [
          netWorthRes,
          bankTransactionsRes,
          creditReportRes,
          epfDetailsRes
        ] = await Promise.all([
          mcpClient.callTool('fetch_net_worth'),
          mcpClient.callTool('fetch_bank_transactions'),
          mcpClient.callTool('fetch_credit_report'),
          mcpClient.callTool('fetch_epf_details'),
        ]);

        const structuredData: FinancialDataForLLM = {
          netWorth: netWorthRes.netWorthResponse,
          bankTransactions: bankTransactionsRes.bankTransactions,
          creditReport: creditReportRes.creditReports[0].creditReportData,
          epfDetails: epfDetailsRes.uanAccounts[0].rawDetails,
        };

        setFinancialData(structuredData);

      } catch (err: any) {
        console.error("Scenario Planning Data Fetch Error:", err);
        setError(err.message || "An unknown error occurred while fetching your financial data.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAndSetFinancialData();
  }, [router]); // Depend on router to ensure redirect logic works

  // --- Helper to convert fetched data to string for LLM context ---
  const getFinancialDataAsString = (): string => {
    if (!financialData) {
      return "No financial data available.";
    }

    let dataString = "User Financial Portfolio:\n\n";

    // Net Worth Summary
    dataString += "### Net Worth ###\n";
    dataString += `Total Net Worth: INR ${financialData.netWorth?.totalNetWorthValue?.units || 0}\n`;
    dataString += "Assets:\n";
    financialData.netWorth?.assetValues?.forEach(asset => {
      dataString += `- ${asset.netWorthAttribute.replace(/_/g, ' ')}: INR ${asset.value.units}\n`;
    });
    dataString += "Liabilities:\n";
    financialData.netWorth?.liabilityValues?.forEach(liability => {
      dataString += `- ${liability.netWorthAttribute.replace(/_/g, ' ')}: INR ${liability.value.units}\n`;
    });
    dataString += "\n";

    // Account Details
    dataString += "### Account Details ###\n";
    if (financialData.netWorth?.accountDetailsBulkResponse?.accountDetailsMap) {
        Object.values(financialData.netWorth.accountDetailsBulkResponse.accountDetailsMap).forEach(item => {
            const acc = item.accountDetails;
            const balance = acc.depositSummary?.currentBalance?.units || acc.equitySummary?.currentValue?.units || '0';
            dataString += `- ${acc.fipMeta.displayName} (${acc.accInstrumentType.replace(/_/g, ' ')}, Masked: ${acc.maskedAccountNumber}): INR ${balance}\n`;
        });
    } else {
        dataString += "No detailed account information available.\n";
    }
    dataString += "\n";

    // Bank Transactions (e.g., last 10)
    dataString += "### Recent Bank Transactions (Last 10) ###\n";
    if (financialData.bankTransactions?.[0]?.txns?.length > 0) {
        financialData.bankTransactions[0].txns.slice(0, 10).forEach(txn => {
            dataString += `- Date: ${txn[2]}, Description: ${txn[1]}, Amount: ${txn[3] === 1 ? '+' : '-'} INR ${txn[0]}\n`;
        });
    } else {
        dataString += "No recent bank transactions available.\n";
    }
    dataString += "\n";

    // Credit Report
    dataString += "### Credit Report ###\n";
    dataString += `Credit Score (Experian): ${financialData.creditReport?.score?.bureauScore || 'N/A'}\n`;
    dataString += "Loan & Credit Accounts:\n";
    financialData.creditReport?.creditAccount?.creditAccountDetails?.forEach(acc => {
        dataString += `- Lender: ${acc.subscriberName}, Type: ${acc.accountType}, Balance: INR ${acc.currentBalance}, Past Due: INR ${acc.amountPastDue}\n`;
    });
    dataString += "\n";

    // EPF Details
    dataString += "### EPF Details ###\n";
    dataString += `Overall PF Balance: INR ${financialData.epfDetails?.overall_pf_balance?.current_pf_balance || '0'}\n`;
    financialData.epfDetails?.est_details?.forEach(est => {
        dataString += `- Establishment: ${est.est_name}, Balance: INR ${est.pf_balance.net_balance}\n`;
    });
    dataString += "\n";

    return dataString;
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!financialData) {
      toast({
        title: "Error",
        description: "Financial data is not yet loaded. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingForm(true);
    setResult(null);
    try {
      const response = await scenarioPlanning({
        ...values,
        financialData: getFinancialDataAsString(), // Use the actual fetched data
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
      setIsLoadingForm(false);
    }
  }

  // --- Render Loading/Error States for Data Fetching ---
  if (isLoadingData) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader className="mr-2 h-8 w-8 animate-spin" />
        <p>Fetching your financial data for scenario planning...</p>
      </main>
    );
  }

  if (error || !financialData) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Financial Data</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </main>
    );
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
              <Button type="submit" disabled={isLoadingForm || isLoadingData}>
                {isLoadingForm ? (
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