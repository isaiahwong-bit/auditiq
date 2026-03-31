import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Claude] ANTHROPIC_API_KEY not set — AI features disabled');
}

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'missing',
});
