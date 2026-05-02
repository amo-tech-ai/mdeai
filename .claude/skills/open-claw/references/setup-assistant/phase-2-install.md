## Phase 2 — Install OpenClaw

### 2.1 Install

**macOS / Linux:**
```bash
npm install -g openclaw@latest
```

**Windows (PowerShell):**
```powershell
npm install -g openclaw@latest
```

Verify:
```
openclaw --version
```

### 2.2 Write Config File

Do NOT use `openclaw config set` — it may produce no output in some versions,
making success unverifiable. Write directly to the config file instead.

**Create config directory and file if missing:**

macOS / Linux:
```bash
mkdir -p ~/.openclaw
[ -f ~/.openclaw/openclaw.json ] || echo '{}' > ~/.openclaw/openclaw.json
```

Windows (PowerShell):
```powershell
$dir = "$env:USERPROFILE\.openclaw"
$file = "$dir\openclaw.json"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
if (!(Test-Path $file)) { '{}' | Set-Content $file }
```

**Write the full config using the template for the selected provider:**

> Note: All templates include the required `gateway` section. Without
> `gateway.mode`, OpenClaw will refuse to start.

---

**Template A — DeepSeek (recommended for China users)**
```json
{
  "models": {
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "YOUR_API_KEY",
        "api": "openai-completions"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-chat"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "GENERATE_A_RANDOM_TOKEN"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  },
  "plugins": {
    "enabled": true,
    "allow": []
  }
}
```

---

**Template B — Anthropic (Claude)**
```json
{
  "models": {
    "providers": {
      "anthropic": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-5"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "GENERATE_A_RANDOM_TOKEN"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  },
  "plugins": {
    "enabled": true,
    "allow": []
  }
}
```

---

**Template C — OpenAI**
```json
{
  "models": {
    "providers": {
      "openai": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "GENERATE_A_RANDOM_TOKEN"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  },
  "plugins": {
    "enabled": true,
    "allow": []
  }
}
```

---

**Template D — Alibaba Bailian Standard (DashScope)**
```json
{
  "models": {
    "providers": {
      "dashscope": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "YOUR_API_KEY",
        "api": "openai-completions"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "dashscope/qwen-max"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "GENERATE_A_RANDOM_TOKEN"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  },
  "plugins": {
    "enabled": true,
    "allow": []
  }
}
```

---

**Template E — Alibaba Bailian Coding Plan**

This is a different endpoint and requires an explicit models array declaration.
The provider name is `bailian` (NOT `dashscope`) and baseUrl is different.

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "bailian": {
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1",
        "apiKey": "YOUR_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3.5-plus",
            "name": "qwen3.5-plus",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 1000000,
            "maxTokens": 65536
          },
          {
            "id": "qwen3-coder-plus",
            "name": "qwen3-coder-plus",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 262144,
            "maxTokens": 65536
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "bailian/qwen3.5-plus"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "GENERATE_A_RANDOM_TOKEN"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  },
  "plugins": {
    "enabled": true,
    "allow": []
  }
}
```

---

**Generating the gateway token:**

Before writing the config, generate a random token to use as `gateway.auth.token`.
Save this token — it will also be needed in Phase 4 for DingTalk's `gatewayToken` field.

macOS / Linux:
```bash
GATEWAY_TOKEN=$(openssl rand -hex 32)
echo "Gateway token: $GATEWAY_TOKEN"
```

Windows (PowerShell):
```powershell
$GATEWAY_TOKEN = -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
Write-Host "Gateway token: $GATEWAY_TOKEN"
```

Replace `GENERATE_A_RANDOM_TOKEN` in the config template with this value.

**Verify the config was written correctly:**

macOS / Linux:
```bash
cat ~/.openclaw/openclaw.json
```

Windows (PowerShell):
```powershell
Get-Content "$env:USERPROFILE\.openclaw\openclaw.json"
```

### 2.3 Start the Gateway

**macOS / Linux:**
```bash
openclaw gateway install
openclaw gateway start
```

**Windows (PowerShell):**

On Windows, `openclaw gateway install` registers a Scheduled Task (not a Windows
Service) and does NOT require administrator privileges.

```powershell
openclaw gateway install
openclaw gateway start
```

If `gateway install` fails for any reason, fall back to foreground mode:
```powershell
# Runs in a separate window — works fine, won't auto-start after reboot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "openclaw gateway run" -WindowStyle Normal
```

### 2.4 Verify

```
openclaw doctor
openclaw gateway status
```

**Also run a quick health check to confirm the Gateway is responding:**

macOS / Linux:
```bash
curl http://127.0.0.1:18789/health
# Expected: {"status":"ok"} or similar
```

Windows (PowerShell):
```powershell
(Invoke-WebRequest http://127.0.0.1:18789/health).Content
# Expected: {"status":"ok"} or similar
```

If the health check fails but `gateway status` says running, wait 5 seconds
and try again — the gateway may still be starting up.

Show the user:
```
OpenClaw installed — version [X]
Gateway running on port 18789
Health check passed ✓
AI model connected: [Provider]
```

---

