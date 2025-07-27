'use server';
/**
 * @fileOverview A flow to simulate updating the market value of a financial asset.
 *
 * - updateAssetValue - A function that returns a simulated new value for an asset.
 * - UpdateAssetValueInput - The input type for the updateAssetValue function.
 * - UpdateAssetValueOutput - The return type for the updateAssetValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UpdateAssetValueInputSchema = z.object({
  assetName: z.string().describe('The name of the asset to update.'),
  currentValue: z.number().describe('The current market value of the asset.'),
});
export type UpdateAssetValueInput = z.infer<typeof UpdateAssetValueInputSchema>;

const UpdateAssetValueOutputSchema = z.object({
  updatedValue: z.number().describe('The new, simulated market value of the asset.'),
});
export type UpdateAssetValueOutput = z.infer<typeof UpdateAssetValueOutputSchema>;

export async function updateAssetValue(input: UpdateAssetValueInput): Promise<UpdateAssetValueOutput> {
  return updateAssetValueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'updateAssetValuePrompt',
  input: {schema: UpdateAssetValueInputSchema},
  output: {schema: UpdateAssetValueOutputSchema},
  prompt: `You are a financial market data simulator. 
Given the asset '{{assetName}}' with a current value of {{currentValue}}, provide a new, realistic, slightly fluctuated market value for today.
For stocks, assume some volatility (change between -5% and +5%). For gold, assume less volatility (change between -2% and +2%).
IMPORTANT: Respond with only the final number for the updatedValue, without any currency symbols, commas, or explanatory text.`,
});

const updateAssetValueFlow = ai.defineFlow(
  {
    name: 'updateAssetValueFlow',
    inputSchema: UpdateAssetValueInputSchema,
    outputSchema: UpdateAssetValueOutputSchema,
  },
  async input => {
    // Simulate a delay to make it feel like a real API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const {output} = await prompt(input);
    return output!;
  }
);
