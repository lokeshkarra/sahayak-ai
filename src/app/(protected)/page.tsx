"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { Logo } from "@/components/logo";
import { McpClient } from "@/services/mcp-client"; // Adjust this path if your mcp-client.ts is elsewhere

// --- TYPE DEFINITIONS (Unchanged from your provided code) ---
interface Value {
  currencyCode: string;
  units: string;
}

interface AssetValue {
  netWorthAttribute: string;
  value: Value;
}

interface LiabilityValue {
  netWorthAttribute: string;
  value: Value;
}

interface AccountDetailsInfo {
    maskedAccountNumber: string;
    accInstrumentType: string;
    fipMeta: {
        displayName: string;
    }
    depositSummary?: {
        currentBalance: Value;
    }
    equitySummary?: {
        currentValue: Value;
    }
}

interface NetWorthData {
  assetValues: AssetValue[];
  liabilityValues: LiabilityValue[];
  totalNetWorthValue: Value;
  accountDetailsBulkResponse?: {
      accountDetailsMap: Record<string, { accountDetails: AccountDetailsInfo }>;
  }
}

type BankTransaction = [string, string, string, number, string, string];

interface BankTransactionsData {
    bank: string;
    txns: BankTransaction[];
}

interface CreditAccountDetails {
    subscriberName: string;
    accountType: string;
    highestCreditOrOriginalLoanAmount: string;
    currentBalance: string;
    amountPastDue: string;
}

interface CreditReportData {
    creditAccount: {
        creditAccountDetails: CreditAccountDetails[];
    }
    score: {
        bureauScore: string;
    }
}

interface EPFEstablishment {
    est_name: string;
    pf_balance: {
        net_balance: string;
    }
}

interface EPFData {
    est_details: EPFEstablishment[];
    overall_pf_balance: {
        current_pf_balance: string;
    }
}

// --- HELPER & UI COMPONENTS (Unchanged) ---
const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
};

const formatTitle = (title: string) => {
    return title.replace(/_/g, ' ').replace('ASSET TYPE', '').replace('LIABILITY TYPE', '').replace('ACC INSTRUMENT TYPE', '').trim();
}

const CreditScoreGauge = ({ score }: { score: number }) => {
    const getScoreColor = (s: number) => {
        if (s > 750) return "text-green-500";
        if (s > 650) return "text-yellow-500";
        return "text-red-500";
    };
    return (
        <Card className="bg-gray-900/50">
            <CardHeader>
                <CardTitle>Credit Score</CardTitle>
                <CardDescription>Provided by Experian</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
                <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
                    {score}
                </div>
            </CardContent>
        </Card>
    );
};

const NetWorthSummary = ({ data }: { data: NetWorthData }) => {
    const totalAssets = data?.assetValues?.reduce((sum, asset) => sum + Number(asset.value.units), 0) || 0;
    const totalLiabilities = data?.liabilityValues?.reduce((sum, liability) => sum + Number(liability.value.units), 0) || 0;

    return (
        <Card className="bg-gray-900/50 col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>A snapshot of your assets and liabilities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <p className="text-sm text-gray-400">Total Net Worth</p>
                    <p className="text-4xl font-bold text-green-400">{formatCurrency(data?.totalNetWorthValue?.units || 0)}</p>
                </div>
                <div className="flex justify-around items-center pt-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Total Assets</p>
                        <p className="text-2xl font-semibold text-white">{formatCurrency(totalAssets)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Total Liabilities</p>
                        <p className="text-2xl font-semibold text-white">{formatCurrency(totalLiabilities)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};

// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
    const [data, setData] = useState<{
        netWorth: NetWorthData;
        bankTransactions: BankTransactionsData[];
        creditReport: CreditReportData;
        epfDetails: EPFData;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const user = sessionStorage.getItem("mcp-user");
        if (!user) {
            router.push("/"); // Redirect to login page if no user in session
            return;
        }

        // This is the new data fetching logic that calls your MCP server
        const fetchAndSetData = async () => {
            setIsLoading(true);
            setError("");
            try {
                const mcpClient = new McpClient();

                // Call all the tools concurrently for better performance
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

                // Structure the data to match what the UI components expect
                const structuredData = {
                    netWorth: netWorthRes.netWorthResponse,
                    bankTransactions: bankTransactionsRes.bankTransactions,
                    creditReport: creditReportRes.creditReports[0].creditReportData,
                    epfDetails: epfDetailsRes.uanAccounts[0].rawDetails,
                };
                
                setData(structuredData);

            } catch (err: any) {
                console.error("Dashboard Fetch Error:", err);
                setError(err.message || "An unknown error occurred while fetching your data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndSetData();
    }, [router]);

    if (isLoading) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-black text-white">
                <Loader className="mr-2 h-8 w-8 animate-spin" />
                <p>Connecting to MCP Server and fetching your financial data...</p>
            </main>
        );
    }
    
    if (error || !data) {
         return (
            <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
                <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Dashboard</h2>
                    <p className="text-red-300 mb-4">{error}</p>
                    <Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </main>
        );
    }

    // --- JSX RENDER (Unchanged, but now powered by live data) ---
    return (
        <main className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Logo />
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>
                <Button variant="outline" onClick={() => {
                    // Clear all session data on logout for a clean slate
                    sessionStorage.clear();
                    router.push('/');
                }}>Logout</Button>
            </header>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-900/80">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="transactions">Bank Transactions</TabsTrigger>
                    <TabsTrigger value="credit">Credit Report</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <NetWorthSummary data={data.netWorth} />
                        <CreditScoreGauge score={Number(data.creditReport?.score?.bureauScore || 0)} />
                        
                        <Card className="bg-gray-900/50">
                            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="text-green-500" /> Assets</CardTitle></CardHeader>
                            <CardContent>
                                {(data.netWorth?.assetValues || []).map((asset: AssetValue) => (
                                    <div key={asset.netWorthAttribute} className="flex justify-between items-center text-sm mb-2">
                                        <p className="text-gray-300 capitalize">{formatTitle(asset.netWorthAttribute)}</p>
                                        <p className="font-medium">{formatCurrency(asset.value.units)}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50">
                            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="text-red-500" /> Liabilities</CardTitle></CardHeader>
                            <CardContent>
                                {(data.netWorth?.liabilityValues || []).map((liability: LiabilityValue) => (
                                     <div key={liability.netWorthAttribute} className="flex justify-between items-center text-sm mb-2">
                                        <p className="text-gray-300 capitalize">{formatTitle(liability.netWorthAttribute)}</p>
                                        <p className="font-medium">{formatCurrency(liability.value.units)}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                         <Card className="bg-gray-900/50">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="text-blue-400" /> EPF Summary</CardTitle></CardHeader>
                             <CardContent>
                                <div className="flex justify-between items-center text-lg mb-2">
                                    <p className="text-gray-300">Total PF Balance</p>
                                    <p className="font-bold">{formatCurrency(data.epfDetails?.overall_pf_balance?.current_pf_balance || 0)}</p>
                                </div>
                                {(data.epfDetails?.est_details || []).map((est: EPFEstablishment) => (
                                     <div key={est.est_name} className="flex justify-between items-center text-sm mt-4">
                                        <p className="text-gray-400">{est.est_name}</p>
                                        <p className="font-medium">{formatCurrency(est.pf_balance.net_balance)}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="accounts" className="mt-6">
                     <Card className="bg-gray-900/50">
                         <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Institution</TableHead>
                                        <TableHead>Account Type</TableHead>
                                        <TableHead>Account Number</TableHead>
                                        <TableHead className="text-right">Balance / Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.values(data.netWorth?.accountDetailsBulkResponse?.accountDetailsMap || {}).map((item: {accountDetails: AccountDetailsInfo}) => (
                                        <TableRow key={item.accountDetails.maskedAccountNumber}>
                                            <TableCell className="font-medium">{item.accountDetails.fipMeta.displayName}</TableCell>
                                            <TableCell className="capitalize">{formatTitle(item.accountDetails.accInstrumentType)}</TableCell>
                                            <TableCell>{item.accountDetails.maskedAccountNumber}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(item.accountDetails.depositSummary?.currentBalance?.units || item.accountDetails.equitySummary?.currentValue?.units || '0')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </CardContent>
                     </Card>
                </TabsContent>

                <TabsContent value="transactions" className="mt-6">
                    <Card className="bg-gray-900/50">
                        <CardHeader><CardTitle>Recent Bank Transactions</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Bank</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(data.bankTransactions?.[0]?.txns || []).slice(0, 25).map((txn: BankTransaction, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>{txn[2]}</TableCell>
                                            <TableCell>{data.bankTransactions[0].bank}</TableCell>
                                            <TableCell className="text-gray-400 text-xs">{txn[1]}</TableCell>
                                            <TableCell className={`text-right font-semibold ${txn[3] === 1 ? 'text-green-500' : 'text-red-500'}`}>
                                                {txn[3] === 1 ? '+' : '-'} {formatCurrency(txn[0])}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="credit" className="mt-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <CreditScoreGauge score={Number(data.creditReport?.score?.bureauScore || 0)} />
                        </div>
                        <div className="md:col-span-2">
                            <Card className="bg-gray-900/50">
                                <CardHeader><CardTitle>Loan & Credit Accounts</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Lender</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-right">Past Due</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(data.creditReport?.creditAccount?.creditAccountDetails || []).map((acc: CreditAccountDetails, index: number) => (
                                                <TableRow key={`${acc.subscriberName}-${index}`}>
                                                    <TableCell>{acc.subscriberName}</TableCell>
                                                    <TableCell>Loan/Credit</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(acc.currentBalance)}</TableCell>
                                                    <TableCell className={`text-right ${Number(acc.amountPastDue) > 0 ? 'text-red-500 font-bold' : ''}`}>
                                                        {formatCurrency(acc.amountPastDue)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                     </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}