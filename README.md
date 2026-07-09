# Gatelit

**Ship prompts to production with confidence.**

Version your prompts. Test them before they break. Run them through any model — without rewriting your integration every time a new provider drops.

---

## The problem

You're shipping LLM features to production. Your prompts live in code, in a Notion doc, or spread across five different provider dashboards. When you tweak a prompt, you have no idea if it actually improved anything. When a provider deprecates a model, you're scrambling.

Portkey and others help with routing and observability. But **nobody helps you manage prompts like real engineering artifacts** — with versioning, regression testing, and structured output guarantees across providers.

---

## What Gatelit does

**Standardized output schemas** — define your output shape once in a canonical format. Gatelit translates it into each provider's native schema (OpenAI structured output, Anthropic tool use, etc.). Because the schema stays the same regardless of provider, models become interchangeable — and fallback chains actually work, since every model in the chain produces the same output shape.

**Prompt management** — every prompt is versioned. Compose from `{{variables}}` and `{{> partials}}`. Edit, rollback, A/B test. No more prompts scattered across code, Notion, and five provider dashboards.

**Regression testing** — write test scenarios with assertions. When you tweak a prompt or swap models, run the suite to see what broke. Like unit tests, but for your LLM calls.

---

## Quick look

```ts
import { GatelitClient } from "@gatelit/sdk"

const client = new GatelitClient({
  gatewayUrl: "https://gateway.gatelit.dev",
  getToken: async () => ({
    token: process.env.GATELIT_KEY,
    scheme: "GatelitKey",
  }),
})

// Register a prompt in the dashboard — give it a name, schema,
// variables, and fallback models. Then call it by ID from anywhere.

const response = await client.prompts.run("summarize", {
  variables: { article: "...", max_words: 100 },
})

// Output is validated against the prompt's JSON schema.
// If it doesn't match, the gateway rejects it before it reaches your app.
// Swap models, tweak the prompt, or add fallbacks without touching this code.
```

---

## Status

Gatelit is in active development. The gateway, dashboard, and SDKs are built and running internally. I'm opening up access gradually.

**[Join the waitlist →](https://gatelit.dev)**

---

## Why we're building this

We hit the same wall with existing tools: structured outputs locked to one model, no regression testing for prompts, no partials that actually compose. So we built what we needed. Now we're seeing if others need it too.

If this resonates, we'd love to hear what you're using today and where it falls short. Open an issue or reach out.
