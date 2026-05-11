---
title: "Serving a large LLM on multiple GPU nodes — vLLM + Ray step by step"
summary: "A plain-English walkthrough: why we split work across GPUs, how Ray holds the cluster together, and copy-paste steps to get vLLM speaking OpenAI-style HTTP — with terminal snippets you can screenshot for your own runbook."
date: "2026-04-11"
tags: ["vLLM", "Ray", "LLM", "GPU", "Distributed"]
category: [Deep Learning, GenAI, LLM, RAG]
---

![Server room lighting abstract — evocative of clustered accelerators.](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80)

If you’ve ever tried to run a **really** big model—something that doesn’t fit comfortably on one GPU, or one machine—you already know the feeling. The logs say *out of memory*, or throughput crawls, and someone in the room says “we should distribute it.”

That’s what this post is about: **vLLM** does the heavy lifting of **serving** the model (think: an API that streams tokens). **Ray** is the **glue** that sees all your machines as one pool of GPUs and keeps workers in sync. You don’t have to love distributed systems to follow along; you just need patience and matching software versions on every box.

I’ll give you **two ways** to stand up the cluster—pick what matches your world:

1. **Docker path** — the script the vLLM project ships (`run_cluster.sh`). Great when everyone runs the same image.  
2. **Bare-metal path** — you install Python yourself. Closer to how a lot of labs and on-prem racks actually work.

The **gray boxes** below are **fake terminal output**—reasonable examples so you know you’re on the right track. When you need proof for a design doc, grab a **real screenshot** of *your* terminal at the same step. Your driver numbers, IPs, and minor vLLM versions will differ, and that’s normal.

Details and flags change release to release, so keep the official pages handy: **[Run cluster](https://docs.vllm.ai/en/latest/examples/online_serving/run_cluster/)** and **[Multi-node serving](https://docs.vllm.ai/en/latest/examples/online_serving/multi-node-serving/)**.

### What you’re actually wiring up

Imagine a small team: one machine is the **coordinator** (Ray calls it the **head**). The others are **workers**. They all need to see the model weights (usually via a **Hugging Face cache**). When you’re done, you talk to **one HTTP port**—it feels like a tiny OpenAI-compatible server, even though underneath a bunch of GPUs argued about tensors for you.

```text
  [model files on disk / cache]       Ray “head” listens (port 6379)
                |                              |
    +-----------v----------+         +-----------v----------+
    |  machine A + GPUs    | <-----> |  machine B + GPUs    |
    |  (vLLM workers)      |  NICs  |  (vLLM workers)      |
    +----------------------+         +----------------------+
                    |
            you curl :8000 here
```

Don’t worry about every arrow on day one. The mental model is enough: **weights + Ray cluster + one API front door**.

### The two knobs everyone mixes up: TP and PP

Modern LLMs are a **tall stack** of layers. When one GPU can’t hold the model—or can’t run it fast enough—we **split the work**. Two ideas show up in every vendor doc; here they are in plain language.

**Tensor parallel (TP)** — “**Let’s do one layer together, as a team.**”

You chop the **math inside a single layer** across several GPUs. Nobody keeps the full giant matrix in one place; each card holds a slice, they crunch in parallel, then they **merge partial results** over the wire (very fast if they’re on the same server with NVLink; less fun if they’re chatting across a sluggish network).

Easy image: **five people holding one very wide pizza** — everyone takes a bite-zone, but they have to coordinate so the slice lines still make sense.

Because **every single token** touches that whole team, **slow links hurt immediately**. That’s why TP is happiest **inside one box** with fancy GPU-to-GPU cabling.

**Pipeline parallel (PP)** — “**You take the top of the model, I’ll take the bottom.**”

You cut the **depth** of the network into **chunks** (called **stages**). Stage 1 finishes its slice of layers and **passes intermediate results** ("activations") down the line—like a factory belt. It’s a great way to spread a **tall** model when **one layer** already fits, but the **full stack** doesn’t.

Trade-off: belts have **idle moments** (pipeline “bubbles”) unless you feed them enough work. With **tiny batches** or **latency-sensitive** serving, a **very** long pipeline can feel sluggish.

**How they multiply**

For one **logical copy** of the model (one replica you’re serving):

```text
(tensor-parallel-size) × (pipeline-parallel-size) = GPUs you need for that replica
```

Say you have **16 GPUs** total and you set **TP = 8**, **PP = 2**. Rough picture:

```text
Machine A (8 GPUs, TP=8)          Machine B (8 GPUs, TP=8)
  stages: first half of layers  ->  stages: second half of layers
```

So you’re **not** magically making “one 16-GPU layer.” You’re saying: **within each machine**, eight GPUs **team up on each layer there**; then the **two machines** hand work off like a **pipeline**. That’s usually a sane pattern when each node is NVLink-strong **inside**, and the **network between nodes** is good but not magic.

**Quick “if this, try that”**

- **One giant layer won’t fit one GPU** → you probably need **more TP** (more friends on that layer), up to what your **local** interconnect can handle.  
- **The full model still won’t fit even after that** → think about **PP** (split the height).  
- **One beefy server only** → often start with **PP = 1** and push **TP** until things work, then profile.  
- **You want snappy first token** → don’t build a **deep tiny pipeline** without measuring; it can add wait time.

I’m not pretending a table replaces **profiling**—it doesn’t. Once it **runs**, tweak batch size, concurrency, and cache settings. Numbers on a dashboard beat opinions.

### Before you start — quick checklist

Think of this as “things I’ve watched burn an evening when they were wrong.”

| Idea | Plain words |
|------|-------------|
| Same OS/driver ballpark everywhere | Mixed drivers are how you get mysterious CUDA errors. |
| You can SSH between machines without drama | You’ll be repeating steps; save your wrists. |
| Network between GPU boxes isn’t starving | Big models + big batches = surprising traffic. Don’t run GPU traffic over the guest Wi‑Fi VLAN as a joke. |
| Same Python packages, same vLLM build on every node | **This one is non-negotiable.** |
| Logged into Hugging Face if the weights are gated | `huggingface-cli login` once per user/cache story. |

Smoke test on **each** box:

```bash
nvidia-smi
```

You should see your expected GPU count—**screenshot milestone 1**.

```text
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.xx                 Driver Version: 550.xx       CUDA Version: 12.xx     |
| ... rows for each GPU ...                                                              |
+-----------------------------------------------------------------------------------------+
```

### Step 0 — IP addresses (boring but worth five minutes)

Servers have more than one IP. Pick the one that **actually carries traffic to the other GPU nodes**—not the management port you use for IMPI, unless that’s truly the same fabric.

```bash
ip -brief addr
```

Then set placeholders you’ll reuse (change the numbers):

```bash
export HEAD_IP="10.10.10.1"       # coordinator
export WORKER_IP="10.10.10.2"     # another box (each worker uses *its own* IP later)
```

Workers need to reach **`HEAD_IP:6379`**. If that packet doesn’t flow, nothing else will either.

---

## Path A — Docker, the way the upstream example likes it

If you’re okay with containers, vLLM publishes a helper script that basically says: “start Ray in Docker with host networking, mount your Hugging Face cache, and don’t make me type twenty flags from memory.” Fair enough.

Grab the script:

```bash
git clone --depth 1 https://github.com/vllm-project/vllm.git
cd vllm/examples/online_serving
chmod +x run_cluster.sh
```

### Head node

Use an image your team standardizes on (often something like `vllm/vllm-openai`). **`VLLM_HOST_IP`** should be the address **other machines use to find this head**—usually the same idea as `HEAD_IP` unless your network is weird.

```bash
bash run_cluster.sh \
  vllm/vllm-openai \
  "${HEAD_IP}" \
  --head \
  "${HOME}/.cache/huggingface" \
  -e VLLM_HOST_IP="${HEAD_IP}"
```

You want to see Ray come up and stay running—**screenshot milestone 2**:

```text
... ray start --head --node-ip-address=10.10.10.1 --port=6379 --block ...
Ray runtime started ...
```

Leave that terminal alone; it’s holding the cluster heartbeat.

### Worker node(s)

Each worker gets **its own** `VLLM_HOST_IP`:

```bash
bash run_cluster.sh \
  vllm/vllm-openai \
  "${HEAD_IP}" \
  --worker \
  "${HOME}/.cache/huggingface" \
  -e VLLM_HOST_IP="${WORKER_IP}"
```

**Screenshot milestone 3** — something ending in “connected” or “started” without a traceback.

```text
... ray start --address=10.10.10.1:6379 --node-ip-address=10.10.10.2 --block ...
Connected to Ray cluster.
```

### Sanity check

List containers, shell in, ask Ray what it sees:

```bash
docker ps --format '{{.Names}}' | grep node-
docker exec -it <container_name_from_above> /bin/bash
ray status
```

**Screenshot milestone 4** — you want GPU totals that match reality.

```text
======== Autoscaler status: ... ========
Node status
---------------------------------------------------------------
Active:
 1 node_<head> ...
 1 node_<worker> ...
Resources
---------------------------------------------------------------
GPU: 16.0/16.0
```

If GPUs don’t show up, stop and fix that before you chase vLLM.

---

## Path B — No Docker, just Linux and a venv

Some teams want systemd, some want Spack, some want `apt`—so here’s the minimalist version: **same venv path everywhere** (example: `/opt/vllm-venv`).

### Install (every node)

```bash
python3 -m venv /opt/vllm-venv
source /opt/vllm-venv/bin/activate
pip install -U pip
pip install "vllm[ray]" ray[default]
```

### Start the head

```bash
source /opt/vllm-venv/bin/activate
export RAY_EXPERIMENTAL_NOSET_CUDA_VISIBLE_DEVICES=1
ray start --head --node-ip-address="${HEAD_IP}" --port=6379 --dashboard-host=0.0.0.0
```

**Screenshot milestone 5** — Ray prints how workers should join.

```text
Ray runtime started.
...
To connect to this Ray cluster:
  ray start --address='10.10.10.1:6379'
```

### Join workers

```bash
source /opt/vllm-venv/bin/activate
export RAY_EXPERIMENTAL_NOSET_CUDA_VISIBLE_DEVICES=1
ray start --address="${HEAD_IP}:6379" --node-ip-address="${WORKER_IP}"
```

### Double-check

```bash
ray status
```

---

## Step 1 — Ask vLLM to serve

Run this where it makes sense on your layout (often the head or whichever node you pick for the HTTP listener). The **math** below is **example-only**: a **tiny** public model doesn’t *need* sixteen GPUs in real life—I’m using dumb numbers so the **flags** are easy to read. Swap `MODEL` for what you actually run and adjust **TP** and **PP** so the model **fits** and your **network** doesn’t cry.

```bash
source /opt/vllm-venv/bin/activate
export RAY_ADDRESS="${HEAD_IP}:6379"

MODEL="meta-llama/Llama-3.2-1B-Instruct"   # <- change me

vllm serve "${MODEL}" \
  --tensor-parallel-size 8 \
  --pipeline-parallel-size 2 \
  --distributed-executor-backend ray \
  --host 0.0.0.0 \
  --port 8000
```

**Screenshot milestone 6** — you’re looking for “server listening” vibes, not a Python stack trace:

```text
INFO ... Initializing Ray connection to 10.10.10.1:6379
INFO ... Waiting for workers ...
INFO ... Starting vLLM API server on http://0.0.0.0:8000
```

If Ray **can’t place** the job, read the error literally—usually **TP × PP** doesn’t match available GPUs, or a node never registered its cards. `ray status` first, always.

---

## Step 2 — Say hello with curl

List models:

```bash
curl -s "http://${HEAD_IP}:8000/v1/models" | python3 -m json.tool
```

**Screenshot milestone 7** — JSON listing your model id.

Quick chat:

```bash
curl -s "http://${HEAD_IP}:8000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.2-1B-Instruct",
    "messages": [{"role":"user","content":"Reply with OK if you hear me."}],
    "max_tokens": 32
  }' | python3 -m json.tool
```

If you change `MODEL` above, change the `"model"` field here too.

---

## Step 3 — Python feels like OpenAI

If you’ve called the OpenAI API before, this is the same dance with a different `base_url`:

```bash
pip install openai
```

```python
# probe_vllm_cluster.py — edit the IP if needed
from openai import OpenAI

client = OpenAI(base_url="http://10.10.10.1:8000/v1", api_key="not-needed")

r = client.chat.completions.create(
    model="meta-llama/Llama-3.2-1B-Instruct",
    messages=[{"role": "user", "content": "Explain Ray in one short paragraph."}],
    max_tokens=128,
)

print(r.choices[0].message.content)
```

**Screenshot milestone 8** — whatever your model actually said.

---

## When it breaks (the short version)

| What it feels like | What I’d try |
|--------------------|--------------|
| Workers never show up | Firewalls on **6379** and friends; wrong `--node-ip-address`. |
| NCCL noise or hangs | `NCCL_DEBUG=INFO`, nail down the right **network interface** (`NCCL_SOCKET_IFNAME` / `GLOO_SOCKET_IFNAME`) for the **GPU** subnet. |
| Weird IP warnings in Docker | Make the head address you pass into the script agree with `VLLM_HOST_IP`. |
| Stuck “waiting for placements” | Your **TP × PP** fairy tale doesn’t match physics—lower one of them until Ray smiles. |
| “It worked yesterday” | Mixed **driver** or **pip** trees. Boring, but it’s almost always versions. |

Optional: `export NCCL_DEBUG=INFO` when you want the logs to scream details.

When you open a ticket internally, attach **`ray status`**, the **first chunk of vLLM stderr**, and a **note which path (Docker vs bare metal)** you took. That’s worth more than another `nvidia-smi` glamour shot.

### Parting note

Multi-GPU serving looks scary until you split the problem: **get Ray honest about your hardware**, then **right-size TP and PP** for *your* model and *your* network. After that it’s mostly boredom—**pin versions**, **keep caches warm**, and **measure** what you actually shipped. You’ve got this; the cluster doesn’t have to be mysterious.
