import Anthropic from '@anthropic-ai/sdk'

export abstract class BaseAgent {
  protected client: Anthropic
  protected model = 'claude-sonnet-4-6' as const

  constructor(apiKey: string) {
    if (!apiKey || apiKey.startsWith('sk-ant-api03-REPLACE')) {
      throw new Error('ANTHROPIC_API_KEY is not configured.')
    }
    this.client = new Anthropic({ apiKey })
  }

  protected async run(system: string, user: string): Promise<string> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const block = msg.content[0]
    if (block?.type !== 'text') throw new Error('Unexpected response type from Claude')
    return block.text
  }

  protected async *stream(system: string, user: string): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    })
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text
      }
    }
  }

  protected parseJSON<T>(text: string): T {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/({[\s\S]*})/)
    if (!jsonMatch?.[1] && !jsonMatch?.[0]) throw new Error('No JSON found in response')
    return JSON.parse(jsonMatch[1] ?? jsonMatch[0] ?? text) as T
  }
}
