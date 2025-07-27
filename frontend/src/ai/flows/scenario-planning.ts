'use server';

/**
 * @fileOverview A scenario planning AI agent for generating personalized financial projections.
 *
 * - scenarioPlanning - A function that handles the scenario planning process.
 * - ScenarioPlanningInput - The input type for the scenarioPlanning function.
 * - ScenarioPlanningOutput - The return type for the scenarioPlanning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScenarioPlanningInputSchema = z.object({
  financialData: z.string().describe('A consolidated string of the user\'s financial data including assets, liabilities, net worth, credit score and EPF.'),
  userGoals: z.string().describe('The user\'s financial goals, e.g., retirement age, desired retirement income, target home price, etc.'),
  query: z.string().describe('The user specified query relating to their financial future.'),
  language: z.string().describe("The language for the response (e.g., 'English' or 'Telugu')."),
});
export type ScenarioPlanningInput = z.infer<typeof ScenarioPlanningInputSchema>;

const ScenarioPlanningOutputSchema = z.object({
  projection: z.string().describe('A personalized financial projection based on the user\'s data and goals.'),
  explanation: z.string().describe('An explanation of the projection, including key assumptions and recommendations.'),
});
export type ScenarioPlanningOutput = z.infer<typeof ScenarioPlanningOutputSchema>;

export async function scenarioPlanning(input: ScenarioPlanningInput): Promise<ScenarioPlanningOutput> {
  return scenarioPlanningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scenarioPlanningPrompt',
  input: {schema: ScenarioPlanningInputSchema},
  output: {schema: ScenarioPlanningOutputSchema},
  prompt: `You are **Personal Chanakya**, a strategic AI finance advisor built on Indian financial wisdom and powered by Gemini.

Your primary goal is to generate a personalized financial projection and explain the key assumptions and recommendations based on the user's financial data and goals. You will use the user's financial data to simulate future scenarios.

---

### 🧠 Your Behavior:

-   Be **conversational**, **wise**, and **strategic** like Chanakya.
-   Focus on **clarity**, **actionable suggestions**, and **trust**.
-   Don’t give generic advice — always use the user’s actual data.
-   IMPORTANT: You MUST provide the entire response (projection and explanation) in the following language: {{{language}}}.

---

### 🧾 Input Data

Here is the user's financial data in JSON format:
{{{financialData}}}

User Goals:
{{{userGoals}}}

User's Specific Question/Query:
{{{query}}}

---

Based on this information, generate a projection and an explanation of how it was determined. Focus on answering the user's query with the projection.`,
});

const scenarioPlanningFlow = ai.defineFlow(
  {
    name: 'scenarioPlanningFlow',
    inputSchema: ScenarioPlanningInputSchema,
    outputSchema: ScenarioPlanningOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
