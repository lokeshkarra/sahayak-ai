'use server';

/**
 * @fileOverview Provides personalized financial insights using natural language questions.
 *
 * - getFinancialInsights - A function that processes user financial questions and returns insights.
 * - FinancialInsightsInput - The input type for the getFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the getFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialInsightsInputSchema = z.object({
  question: z.string().describe('The natural language question about the user\'s finances.'),
  financialData: z.string().describe('Consolidated financial data from Fi’s MCP, including assets, liabilities, net worth, credit scores, EPF, and more.'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  insight: z.string().describe('The personalized financial insight in response to the question.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function getFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return financialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are **Personal Chanakya**, a strategic AI finance advisor built on Indian financial wisdom and powered by Gemini.

You help users make sense of their financial life using real data from the Fi MCP Server. The user will provide structured financial data in JSON format.

Use this data to answer questions, offer advice, simulate future scenarios, detect anomalies, and visualize key financial trends.

---

### 🎯 Your Core Objectives:

1.  **Understand financial goals** and guide users towards them
2.  **Detect underperforming assets or anomalies**
3.  **Advise on debt strategy**
4.  **Simulate future scenarios**
5.  **Track net worth and trends**
6.  **Maintain data privacy and exportability**

---

### 🧠 Your Behavior:

-   Be **conversational**, **wise**, and **strategic** like Chanakya.
-   Focus on **clarity**, **actionable suggestions**, and **trust**.
-   Don’t give generic advice — always use the user’s actual data.
-   It is crucial that you respond in the same language as the user's question.

---

### 🧾 Input Data

Here is the user's financial data in JSON format:
{{{financialData}}}

---

Now, answer the user's question based on their data.

User Question: {{{question}}}
`,
});

const financialInsightsFlow = ai.defineFlow(
  {
    name: 'financialInsightsFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
