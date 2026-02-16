# Local Agent Model Options (Ollama)

Date: 2026-02-15

## Executive Summary
If the goal is to keep costs down while running a capable local agent, the most practical path is to use small-to-mid open models that are readily available in Ollama and have permissive licenses. Based on current open-weight options, these are the best tiers to consider:

1. **Low cost / low VRAM**: Phi-3 Mini (3.8B), Gemma 3 1B/4B, Llama 3.2 1B/3B
2. **Balanced quality + cost**: Llama 3.1 8B, Qwen2.5 7B/14B, Mistral 7B
3. **Highest quality (higher hardware cost)**: Llama 3.1 70B, Qwen2.5 32B/72B, Mixtral 8x7B, DeepSeek R1 distills 14B/32B

## Assumptions
- You already run Ollama locally and want to host open-weight models on your own hardware.
- You want a practical model for agent-style workflows (tool use, code, reasoning) without relying on paid APIs.

## Shortlist of Local Models

### Meta Llama family
- **Llama 3.1 (8B / 70B / 405B)** supports 128K context and is broadly available for local hosting.
- **Llama 3.2 (1B / 3B)** is a smaller, lower-cost option with 128K context.
- License: Llama Community License (not Apache/MIT).

### Qwen family
- **Qwen2.5 (0.5B to 72B)** supports up to 128K context and covers a wide size range.
- Most sizes are Apache 2.0, but the 3B and 72B sizes have Qwen-specific licenses.

### Mistral family
- **Mistral 7B** is a compact open-weight baseline.
- **Mixtral 8x7B / 8x22B** provide higher quality via MoE at higher hardware cost.
- Many Mistral open models are Apache 2.0 licensed.

### Google Gemma family
- **Gemma 3 (270M / 1B / 4B / 12B / 27B)** supports 128K context in the 4B+ sizes and 32K in the 1B/270M sizes, and includes multimodal variants.
- License: Google Gemma terms (more restrictive than Apache/MIT).

### Microsoft Phi family
- **Phi-3 Mini (3.8B) / Medium (14B)** are compact, efficient models, with a 128K context variant available for Phi-3 Mini.

### DeepSeek R1 distills
- **DeepSeek-R1 distills (1.5B / 7B / 8B / 14B / 32B / 70B)** are trained for strong reasoning.
- MIT-licensed, but distills inherit base-model licenses (Qwen or Llama).

## Licensing and Commercial Use Notes
- **Permissive**: Apache 2.0 (many Qwen2.5 and Mistral models), MIT (DeepSeek R1 weights/code).
- **Restricted**: Llama Community License and Google Gemma terms impose extra usage requirements.
- If this project will be commercial or redistributed, align model choices to license constraints early.

## Hardware Considerations (Practical Guidance)
- Small models (1B–4B) are feasible on commodity laptops; larger models (12B–27B) generally need a discrete GPU.
- Google provides reference memory requirements for Gemma 3 across sizes and quantization levels; those values are a useful baseline for planning GPU VRAM.

## Recommendations by Budget Tier

### Tier 1: Minimal hardware (CPU or small GPU)
- Phi-3 Mini (3.8B)
- Gemma 3 1B or 4B
- Llama 3.2 1B/3B

### Tier 2: Mid-tier GPU (balanced)
- Llama 3.1 8B
- Qwen2.5 7B or 14B
- Mistral 7B

### Tier 3: High-end GPU or multi-GPU
- Llama 3.1 70B
- Qwen2.5 32B or 72B
- Mixtral 8x7B
- DeepSeek R1 distills 14B/32B (reasoning-focused)

## Next Steps (if helpful)
- Pick one Tier 2 model and one Tier 1 model for side-by-side testing in your agent workflow.
- If you share your GPU/CPU specs, I can narrow this to the best two candidates.

## Sources
- Meta Llama model list and model cards
- Qwen2.5 model card
- Mistral AI model weights and license list
- Google Gemma 3 documentation (overview + memory guidance)
- Microsoft Phi-3 technical report
- DeepSeek-R1 repository
- Ollama model library pages for Llama 3.x, Qwen2.5, Gemma 3, Phi-3, Mixtral, and DeepSeek-R1
