# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# design
- No glassmorphism, no gradients, no emoji-as-icons, no default shadcn theme styling. Confidence: 0.85
- Dark mode is the default and only theme. Confidence: 0.85
- Use shadcn/ui as structural primitives only — restyle every token (radius, spacing, shadow, type) to avoid the default shadcn look. Confidence: 0.80
- Replace generic loading spinners with deliberate, custom empty/loading states for every screen. Confidence: 0.80

# nextjs
- Next.js app deployed on Vercel. Confidence: 0.50

# workflow
- State design rationale (typography, color palette, hero interaction) before generating any frontend code. Confidence: 0.70
- Build against mock data — OpenCode and Mimo Code handle the real backend and database. Confidence: 0.75

# architecture
- The Live Pipeline View processes PRs through five backend agents in sequence: Profiler → Router → Diff Reasoning → Historian → Explainer. Confidence: 0.75

# providers
- BYOK provider config supports Gemini, Groq, NVIDIA, and Cerebras with visible failover status. Confidence: 0.60
