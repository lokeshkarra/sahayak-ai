"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Save, Loader, RefreshCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { financialData } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { updateAssetValue } from "@/ai/flows/update-asset-value";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const assetSchema = z.object({
  name: z.string().min(1, "Asset name is required."),
  value: z.coerce.number().min(0, "Value must be a positive number."),
  type: z.enum(["stocks", "bullion", "property", "other"]),
});

const loanSchema = z.object({
  name: z.string().min(1, "Loan name is required."),
  value: z.coerce.number().min(0, "Amount must be a positive number."),
});

export default function AssetsPage() {
  const { toast } = useToast();
  const [income, setIncome] = useState(financialData.monthlyIncome);
  const [assets, setAssets] = useState(financialData.assets);
  const [loans, setLoans] = useState(financialData.liabilities);
  const [isIncomeLoading, setIsIncomeLoading] = useState(false);
  const [updatingAssetId, setUpdatingAssetId] = useState<number | null>(null);


  const assetForm = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: { name: "", value: 0, type: "other" },
  });

  const loanForm = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: { name: "", value: 0 },
  });

  const handleIncomeSave = () => {
    setIsIncomeLoading(true);
    setTimeout(() => {
      toast({ title: "Success", description: "Monthly income updated." });
      setIsIncomeLoading(false);
    }, 500);
  };

  function onAddAsset(values: z.infer<typeof assetSchema>) {
    setAssets([
      ...assets,
      { id: Date.now(), name: values.name, value: values.value, type: values.type },
    ]);
    toast({ title: "Asset Added", description: `${values.name} has been added.` });
    assetForm.reset();
  }

  function onAddLoan(values: z.infer<typeof loanSchema>) {
    setLoans([
      ...loans,
      { id: Date.now(), name: values.name, value: values.value },
    ]);
    toast({ title: "Loan Added", description: `${values.name} has been added.` });
    loanForm.reset();
  }
  
  const handleUpdateAsset = async (asset: typeof assets[0]) => {
    setUpdatingAssetId(asset.id);
    try {
        const result = await updateAssetValue({ assetName: asset.name, currentValue: asset.value });
        setAssets(prevAssets => prevAssets.map(a => a.id === asset.id ? { ...a, value: result.updatedValue } : a));
        toast({
            title: "Value Updated",
            description: `${asset.name} is now valued at ₹${result.updatedValue.toLocaleString("en-IN")}.`
        });
    } catch (error) {
        console.error("Failed to update asset value:", error);
        toast({
            title: "Update Failed",
            description: "Could not fetch the latest value for this asset.",
            variant: "destructive"
        });
    } finally {
        setUpdatingAssetId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Assets & Liabilities</CardTitle>
          <CardDescription>
            Manage your financial portfolio by tracking your income, assets, and
            loans.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>Update your current monthly salary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="income">Income (INR)</Label>
                    <Input
                        id="income"
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(Number(e.target.value))}
                        placeholder="e.g., 100000"
                    />
                </div>
                <Button onClick={handleIncomeSave} disabled={isIncomeLoading}>
                    {isIncomeLoading ? <Loader className="animate-spin" /> : <Save />}
                    <span className="sr-only">Save</span>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">This helps in providing accurate financial advice and projections.</p>
          </CardContent>
        </Card>

        {/* Assets Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle>Assets</CardTitle>
                <CardDescription>Gold, land, house, property etc.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>
                <Form {...assetForm}>
                  <form onSubmit={assetForm.handleSubmit(onAddAsset)} className="space-y-4">
                    <FormField
                      control={assetForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Gold (10g)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={assetForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an asset type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="stocks">Stocks</SelectItem>
                              <SelectItem value="bullion">Gold/Bullion</SelectItem>
                              <SelectItem value="property">Property</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assetForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value (INR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 70000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="submit">Add Asset</Button>
                      </DialogClose>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-right">
                      {`₹${asset.value.toLocaleString("en-IN")}`}
                    </TableCell>
                    <TableCell className="text-right">
                      {(asset.type === 'stocks' || asset.type === 'bullion') && (
                        <Button variant="ghost" size="icon" onClick={() => handleUpdateAsset(asset)} disabled={updatingAssetId === asset.id}>
                          {updatingAssetId === asset.id ? <Loader className="animate-spin" /> : <RefreshCcw />}
                           <span className="sr-only">Update Value</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       {/* Loans Card */}
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle>Loans</CardTitle>
                <CardDescription>All outstanding loans and liabilities.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Loan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Loan</DialogTitle>
                </DialogHeader>
                <Form {...loanForm}>
                  <form onSubmit={loanForm.handleSubmit(onAddLoan)} className="space-y-4">
                    <FormField
                      control={loanForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Car Loan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loanForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outstanding Amount (INR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 500000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                       <DialogClose asChild>
                        <Button type="submit">Add Loan</Button>
                      </DialogClose>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.name}</TableCell>
                    <TableCell className="text-right">
                      {`₹${loan.value.toLocaleString("en-IN")}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
