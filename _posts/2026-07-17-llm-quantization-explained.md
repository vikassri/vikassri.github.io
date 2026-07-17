---
title: "LLM Quantization Explained — From FP32 to 4-bit, With Code and Diagrams"
summary: "A practical walkthrough of how LLM quantization shrinks models by 75–90% while keeping them usable: numeric formats, the math behind INT8/INT4, GPTQ vs AWQ vs GGUF, and copy-paste Python you can run today."
date: "2026-07-17"
tags: ["Quantization", "LLM", "GenAI", "BitsAndBytes", "GGUF", "GPTQ", "AWQ"]
category: [Deep Learning, GenAI, LLM]
---

![Abstract circuit board — compression and precision trade-offs in AI hardware.](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80)

Large language models are heavy. A 7B-parameter model in full **FP32** needs roughly **28 GB** just for weights—before activations, KV cache, or batching. That is why most local setups you see on Reddit or Hacker News run **quantized** checkpoints: same architecture, fewer bits per weight, dramatically less VRAM.

This post explains **what quantization actually does**, the **math** behind it (without drowning in notation), how popular methods differ (**GPTQ**, **AWQ**, **GGUF**), and **Python code** you can run to see the trade-offs yourself. It is inspired by the excellent overview at [LocalLLM.in](https://localllm.in/blog/quantization-explained); here I focus on intuition, diagrams, and hands-on snippets.

---

## The core idea in one sentence

**Quantization maps high-precision floating-point weights to lower-precision integers (or smaller floats), stores a small scale/zero-point per group, and dequantizes back at inference time.**

Think of it like converting a 24-bit PNG to an 8-bit palette image: smaller file, slightly less color fidelity, usually good enough.

```text
  FP32 weight tensor  ──quantize──►  INT4/INT8 + scales  ──dequant──►  approximate FP32
     (4 bytes/param)                    (0.5–1 byte/param)              (used in matmul)
```

---

## Why bits matter: a memory mental model

Each parameter occupies `bits ÷ 8` bytes. For a model with **P** parameters:

```text
model_size_bytes ≈ P × (bits_per_weight / 8)
```

| Format | Bits | Bytes/param | 7B model (weights only) | vs FP32 |
|--------|------|-------------|-------------------------|---------|
| FP32   | 32   | 4           | ~28 GB                  | baseline |
| FP16/BF16 | 16 | 2        | ~14 GB                  | 50% |
| INT8   | 8    | 1           | ~7 GB                   | 75% |
| INT4   | 4    | 0.5         | ~3.5 GB                 | 87.5% |

Real deployments add **overhead** (activations, KV cache, CUDA context). Rule of thumb: plan for **1.2–1.5×** the weight-only number for inference VRAM at batch size 1.

```text
  FP32 (32 bit, 4 B/param)
      │
      │  cast to half precision (GPU-friendly)
      ▼
  FP16 / BF16 (16 bit, 2 B/param)
      │
      │  integer quantization
      ▼
  INT8 (8 bit, 1 B/param)  ──►  75% smaller than FP32
      │
      │  aggressive 4-bit packing
      ▼
  INT4 (4 bit, 0.5 B/param)  ──►  87.5% smaller than FP32
```

---

## Two families of quantization

### 1. Floating-point quantization (FP32 → FP16/BF16)

Direct cast to a format with fewer exponent/mantissa bits. GPUs love this; quality loss is usually small for inference.

```python
import torch

weights_fp32 = torch.tensor([0.00341, -1.284, 0.991, 2.017], dtype=torch.float32)
weights_fp16 = weights_fp32.to(torch.float16)

print("FP32:", weights_fp32)
print("FP16:", weights_fp16)
print("Max abs error:", (weights_fp32 - weights_fp16.float()).abs().max().item())
```

### 2. Integer quantization (FP32 → INT8/INT4)

Map a **continuous range** of floats to a **discrete grid** of integers. You store:

- **scale** — how big one integer step is in float space  
- **zero_point** (asymmetric only) — which integer represents float `0.0`

At inference, hardware (or kernels) **dequantize on the fly** inside fused matmuls.

```text
  FP32 weights          Quantizer              Storage (INT + scale/zp)
       │                    │                           │
       │  min/max per block │                           │
       ├───────────────────►│  q = round(x/scale + zp)  │
       │                    ├──────────────────────────►│  75–90% smaller
       │                    │                           │
       │                    │         Inference         │
       │                    │              │              │
       │                    │              ▼              │
       │                    │     Dequant + matmul ◄─────┤
       │                    │              │              │
       │                    │              ▼              │
       │                    │           Output x̂ ≈ (q-zp)×scale
```

---

## The math: symmetric vs asymmetric

### Symmetric (absmax) — best when weights cluster around zero

For INT8 range \([-128, 127]\):

```text
α = max(|min|, |max|)
scale = 127 / α
q(x) = clamp(round(scale × x), -128, 127)
x̂ = q(x) / scale
```

### Asymmetric (zero-point) — when the range is shifted

```text
scale = (max - min) / 255
zp = round(-128 - min × scale)
q(x) = clamp(round(scale × x + zp), -128, 127)
x̂ = (q(x) - zp) / scale
```

Below is a **from-scratch** implementation you can step through in a notebook—no GPU required.

```python
import numpy as np
from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class QuantizationResult:
    quantized: np.ndarray
    scale: float
    zero_point: int
    dequantized: np.ndarray
    max_error: float
    mean_error: float


def quantize_symmetric_int8(values: np.ndarray) -> QuantizationResult:
    """Map FP32 values to INT8 using absmax scaling."""
    alpha = float(max(abs(values.min()), abs(values.max()), 1e-8))
    scale = 127.0 / alpha
    quantized = np.clip(np.round(scale * values), -128, 127).astype(np.int8)
    dequantized = quantized.astype(np.float32) / scale
    errors = np.abs(values - dequantized)
    return QuantizationResult(
        quantized=quantized,
        scale=scale,
        zero_point=0,
        dequantized=dequantized,
        max_error=float(errors.max()),
        mean_error=float(errors.mean()),
    )


def quantize_asymmetric_int8(values: np.ndarray) -> QuantizationResult:
    """Map FP32 values to INT8 with zero-point offset."""
    min_val, max_val = float(values.min()), float(values.max())
    scale = (max_val - min_val) / 255.0 if max_val != min_val else 1.0
    zero_point = int(np.round(-128 - min_val / scale))
    quantized = np.clip(
        np.round(values / scale + zero_point), -128, 127
    ).astype(np.int8)
    dequantized = (quantized.astype(np.float32) - zero_point) * scale
    errors = np.abs(values - dequantized)
    return QuantizationResult(
        quantized=quantized,
        scale=scale,
        zero_point=zero_point,
        dequantized=dequantized,
        max_error=float(errors.max()),
        mean_error=float(errors.mean()),
    )


def quantize_int4(values: np.ndarray) -> QuantizationResult:
    """Simulate 4-bit symmetric quantization (16 levels: -8..7)."""
    alpha = float(max(abs(values.min()), abs(values.max()), 1e-8))
    scale = 7.0 / alpha
    quantized = np.clip(np.round(scale * values), -8, 7).astype(np.int8)
    dequantized = quantized.astype(np.float32) / scale
    errors = np.abs(values - dequantized)
    return QuantizationResult(
        quantized=quantized,
        scale=scale,
        zero_point=0,
        dequantized=dequantized,
        max_error=float(errors.max()),
        mean_error=float(errors.mean()),
    )


# Example: a tiny "layer" of weights
np.random.seed(42)
sample_weights = np.random.randn(200).astype(np.float32) * 0.05

for name, fn in [
    ("INT8 symmetric", quantize_symmetric_int8),
    ("INT8 asymmetric", quantize_asymmetric_int8),
    ("INT4 symmetric", quantize_int4),
]:
    result = fn(sample_weights)
    print(
        f"{name:18} | mean err: {result.mean_error:.5f} "
        f"| max err: {result.max_error:.5f} "
        f"| scale: {result.scale:.4f}"
    )
```

**What you should see:** INT8 errors are tiny; INT4 errors jump—especially on outlier weights—but memory drops by ~87.5% vs FP32. That is the trade-off every deployment makes.

---

## Block-wise quantization (why modern LLM quant is not "one scale for the whole model")

Global quantization—one scale for billions of weights—destroys accuracy. Production methods (**GPTQ**, **AWQ**, **GGUF K-quants**) use **blocks** of 32–128 consecutive weights sharing one (or a few) scale factors.

```text
Layer weight matrix (FP32)
┌──────── block 0 ────────┬──────── block 1 ────────┬──── ... ────┐
│ w₀ w₁ ... w₁₂₇          │ w₁₂₈ ... w₂₅₅           │             │
│ scale₀, (zp₀)           │ scale₁, (zp₁)           │             │
└─────────────────────────┴─────────────────────────┴─────────────┘
         │                           │
         ▼                           ▼
    INT4/INT8 grid              INT4/INT8 grid
    (per-block mapping)         (per-block mapping)
```

This preserves local dynamic range: a block of small attention weights and a block with larger FFN weights each get their own mapping.

```python
def quantize_blockwise_int8(
    values: np.ndarray,
    block_size: int = 64,
) -> tuple[np.ndarray, np.ndarray]:
    """Block-wise symmetric INT8 — mirrors how GGUF/GPTQ think about tensors."""
    if values.size % block_size != 0:
        raise ValueError("Tensor size must be divisible by block_size")

    num_blocks = values.size // block_size
    flat = values.reshape(num_blocks, block_size)
    scales = np.max(np.abs(flat), axis=1, keepdims=True)
    scales = np.where(scales < 1e-8, 1.0, scales)
    normalized = flat / scales
    quantized = np.clip(np.round(normalized * 127), -128, 127).astype(np.int8)
    return quantized.reshape(-1), scales.reshape(-1)
```

---

## Activation quantization (the other half of the story)

**Weight quantization** shrinks what you store on disk. **Activation quantization** targets tensors that flow **between layers during inference**—they change with every token and can have **outliers** (a few huge values ruin a naive scale).

Methods like **AWQ** (Activation-aware Weight Quantization) look at which weights matter most when activations are large, and protect them. **SmoothQuant** redistributes scale between weights and activations before quantizing—helpful for INT8 without retraining.

```text
  Token in ──► Embedding ──► Layer 1 ──► activations A₁ ──► Layer 2 ──► ...
                                    │
                                    └── outliers here hurt naive INT8
```

Asymmetric activation quant (per tensor):

```text
scale_a = (max(A) - min(A)) / (2^b - 1)
q(A)    = round((A - min(A)) / scale_a)
Â       = min(A) + q(A) × scale_a
```

In practice, activation quant often needs **calibration data** (a few hundred representative prompts) to pick stable scales.

---

## Major quantization methods — when to use which

```text
                    Pre-trained checkpoint (FP16/FP32)
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
     Post-Training (PTQ)     Post-Training (PTQ)    Quantization-Aware (QAT)
            │                       │                       │
     ┌──────┴──────┐         ┌─────┴─────┐                 │
     ▼             ▼         ▼           ▼                 ▼
   GPTQ          GGUF       AWQ      BitsAndBytes      Fine-tune with
 GPU 2–8 bit   CPU Q2–Q8  accuracy+   NF4 4-bit       simulated low-bit
               Ollama      activations  QLoRA           (best at 2–4 bit)
```

| Method | Strength | Typical use |
|--------|----------|-------------|
| **GPTQ** | Fast GPU inference, one-shot PTQ | vLLM, cloud GPU serving |
| **AWQ** | Best accuracy on chat/instruct models | Production APIs where quality matters |
| **GGUF** | Cross-platform, Ollama/LM Studio/llama.cpp | Local dev, laptops, edge |
| **BitsAndBytes (NF4)** | Load 4-bit in Hugging Face with minimal code | Fine-tuning + inference on one GPU |
| **QAT** | Recovers accuracy at extreme low bit | Custom models, sensitive domains |

### PTQ vs QAT

| Aspect | PTQ | QAT |
|--------|-----|-----|
| Extra training | No | Yes (fine-tune) |
| Speed to deploy | Hours | Days |
| Accuracy at 4-bit | Good (95–98%) | Better (97–99%+) |
| Best for | Most local + prod setups | Medical, finance, low-bit custom models |

**Practical advice:** start with **PTQ** (GGUF Q4_K_M locally, or AWQ/GPTQ in vLLM). Move to **QAT** only if benchmarks fail on your task.

---

## Decoding GGUF names (Q4_K_M and friends)

GGUF files use a pattern like **`Q{bits}_{method}_{size}`**:

| Name | Meaning |
|------|---------|
| **Q** | Quantized |
| **4** | ~4 bits per weight (average; mixed prec inside) |
| **K** | K-means / smarter grouping (llama.cpp "K-quants") |
| **M** | Medium block size |
| **Q8_0** | 8-bit, basic linear quant, no K variant |
| **Q3_K_S** | 3-bit, K-means, small blocks — max compression |

```text
Q4_K_M  ──►  "sweet spot" for most 8–12 GB GPUs
Q8_0    ──►  near-FP16 quality, 2× smaller than FP16
Q3_K_S  ──►  tight RAM, accept some quality loss
```

---

## Model size calculator (run this before you download)

```python
def estimate_model_vram_gb(
    num_params_billion: float,
    bits: int,
    overhead_factor: float = 1.35,
) -> dict[str, float]:
    """Rough VRAM estimate for inference (weights + typical overhead)."""
    bytes_per_param = bits / 8
    weight_gb = num_params_billion * 1e9 * bytes_per_param / (1024**3)
    inference_gb = weight_gb * overhead_factor
    return {
        "weight_only_gb": round(weight_gb, 2),
        "inference_estimate_gb": round(inference_gb, 2),
    }


for label, bits in [("FP32", 32), ("FP16", 16), ("INT8", 8), ("INT4", 4)]:
    est = estimate_model_vram_gb(7.0, bits)
    print(f"7B @ {label:4} → weights {est['weight_only_gb']} GB, "
          f"~inference {est['inference_estimate_gb']} GB")
```

Example output shape:

```text
7B @ FP32 → weights 26.04 GB, ~inference 35.16 GB
7B @ INT8 → weights 6.51 GB,  ~inference 8.79 GB
7B @ INT4 → weights 3.26 GB,  ~inference 4.40 GB
```

That is why **Q4_K_M on a 7B model fits an 8 GB GPU** (with room for context), while FP16 does not.

---

## Hands-on: 4-bit inference with BitsAndBytes

This is the fastest path from "I read about quantization" to "I am running a quantized model." Requires a CUDA GPU and enough disk for the download.

```python
# pip install -U transformers accelerate bitsandbytes torch

from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch

model_name = "Qwen/Qwen2.5-1.5B-Instruct"  # swap for any HF causal LM

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # Normal Float 4 — good for neural nets
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,     # quantize the quantization constants
)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quant_config,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

prompt = "Explain LLM quantization in one paragraph."
inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=120, do_sample=True, temperature=0.7)

print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

**What happens under the hood:**

1. Weights load as **4-bit NF4** blocks with per-block scales.  
2. Matmuls run in **FP16 compute dtype** (fused dequant + multiply).  
3. VRAM drops roughly **4×** vs FP16 for weights—enabling larger models or longer context on the same card.

---

## Platform cheat sheet

| Engine | GGUF | GPTQ | AWQ | Notes |
|--------|------|------|-----|-------|
| **Ollama** | native | — | — | `ollama pull llama3.2` (GGUF inside) |
| **llama.cpp** | native | — | — | CPU + GPU offload |
| **vLLM** | partial | native | native | Production throughput |
| **LM Studio** | via llama.cpp | — | — | GUI, consumer-friendly |
| **TextGen-WebUI** | yes | yes | yes | Experimentation hub |

---

## End-to-end pipeline (how a model gets quantized)

```text
  Hugging Face checkpoint (FP16/FP32)
              │
              ├── Local / Ollama ──► HF → GGUF convert ──► llama-quantize Q4_K_M ──► Deploy
              │
              ├── GPU server ──────► AutoGPTQ / AutoAWQ ──► vLLM / ExLlama ────────► Deploy
              │
              └── Fine-tune ───────► BitsAndBytes 4-bit + LoRA ──► single-GPU infer ──► Deploy
```

Example: quantize to GGUF with llama.cpp (after converting HF → GGUF):

```bash
# Illustrative — exact CLI flags vary by llama.cpp version
./llama-quantize ./model-f16.gguf ./model-q4_k_m.gguf Q4_K_M
```

---

## Quality vs compression — what to expect

| Precision | Size reduction | Typical quality impact |
|-----------|----------------|------------------------|
| INT8 / Q8 | ~75% vs FP32 | <2% perplexity drift |
| INT4 / Q4 | ~87.5% | 2–8% — often imperceptible in chat |
| 3-bit | ~90% | Noticeable on math/code |
| 2-bit | ~94% | Use only when you must |

**Important:** larger base models quantize better. A **13B @ Q4** often beats a **7B @ FP16** on hard tasks—not because quantization is magic, but because capacity survives compression.

---

## When to quantize — and when not to

**Good fits**

- Limited VRAM (consumer GPU, laptop)  
- Cost-sensitive cloud (smaller instances, higher batch throughput)  
- Edge / on-device inference  
- Running many model instances on one host  

**Skip or use Q8 / FP16**

- Medical, legal, or safety-critical outputs where you cannot tolerate drift  
- You already have headroom and latency is fine  
- Active research/debugging where full precision simplifies analysis  

---

## Putting it together

Quantization is not one trick—it is a **family** of techniques that trade a controlled amount of numeric precision for **memory, speed, and cost**. The workflow that works for most readers:

1. **Estimate VRAM** with the calculator above.  
2. **Local dev:** Ollama or LM Studio with **Q4_K_M**.  
3. **Production GPU:** **AWQ** or **GPTQ** behind vLLM.  
4. **Fine-tuning on one GPU:** **BitsAndBytes 4-bit + LoRA**.  
5. **Benchmark** on *your* prompts—not generic leaderboards.

The fundamental equation never changes:

```text
  smaller bits  →  smaller model  →  faster/cheaper inference  →  some precision loss
```

Understanding the math (scale, zero-point, blocks) and running the Python snippets above makes every cryptic filename—`Q4_K_M`, `AWQ`, `nf4`—click into place.

---

## References

- [The Complete Guide to LLM Quantization — LocalLLM.in](https://localllm.in/blog/quantization-explained)  
- [GPTQ paper](https://arxiv.org/abs/2210.17323)  
- [AWQ paper](https://arxiv.org/abs/2306.00978)  
- [llama.cpp / GGUF](https://github.com/ggerganov/llama.cpp)  
- [BitsAndBytes — Hugging Face docs](https://huggingface.co/docs/bitsandbytes/main/en/index)  
- [vLLM quantization guide](https://docs.vllm.ai/en/latest/models/quantization/index.html)
