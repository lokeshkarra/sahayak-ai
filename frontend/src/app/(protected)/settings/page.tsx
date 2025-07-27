"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Link } from "lucide-react";
import { financialData } from "@/lib/mock-data";

export default function SettingsPage() {
  const { toast } = useToast();

  const handleExport = () => {
    const dataStr = JSON.stringify(financialData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'financial_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Exporting Data",
      description: "Your financial data is being downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Manage how your financial data is used and shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="mcp-access">MCP Server Access</Label>
                <p className="text-xs text-muted-foreground">Allow Personal Chanakya to access your consolidated financial data.</p>
            </div>
            <Switch id="mcp-access" defaultChecked />
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="ai-training">Contribute to AI Model</Label>
                <p className="text-xs text-muted-foreground">Allow your anonymized data to be used for improving our AI models.</p>
            </div>
            <Switch id="ai-training" />
          </div>
           <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-muted/40">
            <div className="space-y-0.5">
                <Label htmlFor="gpay-connect" className="flex items-center">
                  <Link className="mr-2 h-4 w-4" />
                  Connect to Google Pay
                </Label>
                <p className="text-xs text-muted-foreground">Securely import transaction data. This is a placeholder for a future feature.</p>
            </div>
            <Switch id="gpay-connect" disabled />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Download a copy of your financial data. You own your data and can use it with other tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export My Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
