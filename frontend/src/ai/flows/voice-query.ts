'use server';

/**
 * @fileOverview A voice query AI agent for financial insights.
 *
 * - voiceQuery - A function that handles voice queries and returns financial insights.
 * - VoiceQueryInput - The input type for the voiceQuery function.
 * - VoiceQueryOutput - The return type for the voiceQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceQueryInputSchema = z.object({
  query: z.string().describe('The voice query from the user.'),
  financialData: z.string().describe('Consolidated financial data, including assets, liabilities, net worth, etc.'),
});
export type VoiceQueryInput = z.infer<typeof VoiceQueryInputSchema>;

const VoiceQueryOutputSchema = z.object({
  insight: z.string().describe('The financial insight generated from the voice query.'),
  audio: z.any().describe('The audio response for the financial insight.'),
});
export type VoiceQueryOutput = z.infer<typeof VoiceQueryOutputSchema>;

export async function voiceQuery(input: VoiceQueryInput): Promise<VoiceQueryOutput> {
  return voiceQueryFlow(input);
}

const voiceQueryPrompt = ai.definePrompt({
  name: 'voiceQueryPrompt',
  input: {schema: VoiceQueryInputSchema},
  output: {schema: z.object({insight: z.string()})},
  prompt: `You are **Personal Chanakya**, a strategic AI finance advisor built on Indian financial wisdom and powered by Gemini.

You help users make sense of their financial life using real data from the Fi MCP Server. The user will provide structured financial data in JSON format.

Your response should be concise and suitable for a voice assistant.

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

Now, answer the user's question based on their data. Keep the answer concise for a voice response.

User Question: {{{query}}}`,
});

const voiceQueryFlow = ai.defineFlow(
  {
    name: 'voiceQueryFlow',
    inputSchema: VoiceQueryInputSchema,
    outputSchema: VoiceQueryOutputSchema,
  },
  async input => {
    const {output: textOutput} = await voiceQueryPrompt(input);
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: textOutput!.insight,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);
    return {
      insight: textOutput!.insight,
      audio: 'data:audio/wav;base64,' + wavData,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const wav = require('wav');
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
