export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { loadLearningStore } from '@/lib/learning-store';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'jsonl';

    const learningStore = loadLearningStore();
    const articles = learningStore.articles || [];

    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, 'data'),
      path.join(cwd, '..', 'data'),
      path.join(cwd, '..', '..', 'data'),
    ];

    let dataDir = path.join(cwd, 'data');
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        dataDir = cand;
        break;
      }
    }

    const datasetPath = path.join(dataDir, 'model_training_dataset.jsonl');

    if (format === 'jsonl') {
      let content = '';
      if (fs.existsSync(datasetPath)) {
        content = fs.readFileSync(datasetPath, 'utf-8');
      } else {
        // Fallback: generate JSONL from articles in memory
        content = articles
          .map((art) =>
            JSON.stringify({
              prompt: art.trainingPrompt || `Analyze threat report: ${art.title}`,
              completion: art.trainingCompletion || art.summary,
              category: art.category,
              cveId: art.cveId || null,
              source: art.source,
            })
          )
          .join('\n');
      }

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/x-jsonlines; charset=utf-8',
          'Content-Disposition': 'attachment; filename="cybermind_model_training_dataset.jsonl"',
        },
      });
    }

    if (format === 'ollama') {
      const modelfileContent = `# CyberMind OS Local LLM Fine-Tuning Modelfile
# Target Base Model: Llama 3.2 8B Instruct / Qwen 2.5 CTI
FROM llama3.2:8b-instruct-q4_K_M

# Set System Prompt for CyberMind AI Assistant
SYSTEM """
You are CyberMind AI, an autonomous Chief Information Security Officer (CISO) and Lead SOC Threat Analyst.
You excel in analyzing CVE vulnerabilities, OSINT threat feeds, Dark Web breach reports, FortiGate/Palo Alto firewall health, and writing Sigma/YARA rules.
Always respond with precise technical mitigations, STIX 2.1 compliance tags, and step-by-step incident response playbooks.
"""

# Temperature and Sampling Parameters
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1

# Dataset Training Pairs Loaded: ${articles.length} CTI Samples
# Fine-Tuning Instruct Format: ChatML / Llama-3 Template
`;

      return new NextResponse(modelfileContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Modelfile"',
        },
      });
    }

    if (format === 'unsloth') {
      const pythonScript = `""
CyberMind OS Autonomous LLM QLoRA Fine-Tuning Script
Powered by Unsloth AI & HuggingFace TRL
Accelerated Training for Llama-3.2-8B / Qwen-2.5 on RTX 4090 / A100 GPUs
""

import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 1. Load Base Model with Unsloth 4-bit Quantization
max_seq_length = 4096
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3.2-8b-instruct-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = None,
    load_in_4bit = True,
)

# 2. Add LoRA Adapters for CTI & SOC Playbook Mastery
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
)

# 3. Load CyberMind Training Dataset
dataset = load_dataset("json", data_files="cybermind_model_training_dataset.jsonl")

# 4. Train Model
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset["train"],
    dataset_text_field = "completion",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        output_dir = "cybermind_outputs",
    ),
)
trainer.train()

# 5. Export GGUF Weights for Ollama & Local CyberMind Deployment
model.save_pretrained_gguf("cybermind_llama3.2_q4_k_m", tokenizer, quantization_method = "q4_k_m")
print("✅ CyberMind Model Fine-Tuning Complete! GGUF exported to cybermind_llama3.2_q4_k_m.gguf")
`;

      return new NextResponse(pythonScript, {
        headers: {
          'Content-Type': 'text/x-python; charset=utf-8',
          'Content-Disposition': 'attachment; filename="train_cybermind_lora.py"',
        },
      });
    }

    if (format === 'sigma') {
      let sigmaRules = `# CyberMind OS Automated Sigma Detection Rules Pack\n# Generated: ${new Date().toISOString()}\n---\n`;

      articles.forEach((art, idx) => {
        const cveStr = art.cveId || 'CVE-2026-UNKNOWN';
        const safeTitle = art.title.replace(/[^a-zA-Z0-9\s]/g, '');
        sigmaRules += `title: CyberMind Detection - ${safeTitle}
id: cm-sigma-${idx + 101}
status: experimental
description: Detects exploitation activity related to ${art.title} (${cveStr}).
references:
  - ${art.url}
author: CyberMind Threat Engine
date: ${art.scrapedAt.split('T')[0]}
tags:
  - attack.t1059
  - attack.t1558
  - ${art.category.toLowerCase()}
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains:
      - '${cveStr}'
      - 'powershell -enc'
      - 'cmd.exe /c'
  condition: selection
falsepositives:
  - Authorized Security Audit / Penetration Testing
level: ${art.severity === 'CRITICAL' ? 'critical' : 'high'}
---
`;
      });

      return new NextResponse(sigmaRules, {
        headers: {
          'Content-Type': 'text/yaml; charset=utf-8',
          'Content-Disposition': 'attachment; filename="cybermind_sigma_rules.yml"',
        },
      });
    }

    if (format === 'yara') {
      let yaraRules = `/*
  CyberMind OS Automated YARA Binary Scanner Rules
  Generated: ${new Date().toISOString()}
*/

`;

      articles.forEach((art, idx) => {
        const safeName = art.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        const cveStr = art.cveId || 'CVE_2026';
        yaraRules += `rule CyberMind_Detect_${safeName}_${idx + 1} {
    meta:
        description = "Detects payload related to ${art.title}"
        author = "CyberMind Threat Engine"
        reference = "${art.url}"
        cve = "${cveStr}"
        severity = "${art.severity || 'HIGH'}"
        date = "${art.scrapedAt.split('T')[0]}"

    strings:
        $s1 = "${cveStr}" ascii wide
        $s2 = "CyberMind" ascii wide
        $s3 = "powershell" ascii wide nocase
        $s4 = "rundll32.exe" ascii wide nocase

    condition:
        uint16(0) == 0x5A4D and (2 of ($s*))
}

`;
      });

      return new NextResponse(yaraRules, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="cybermind_yara_rules.yar"',
        },
      });
    }

    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
