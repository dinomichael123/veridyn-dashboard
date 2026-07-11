import Anthropic from '@anthropic-ai/sdk'

// Returns a singleton Anthropic client.
// ANTHROPIC_API_KEY must be set as an environment variable.
export function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}
