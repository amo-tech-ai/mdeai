## Phase 1 — Environment Setup

> CRITICAL: Follow ONLY the section matching the OS from Phase 0.2.
> Do not mix commands across OS sections under any circumstance.

Run silently. Report in plain language, never raw terminal output.

---

### IF macOS

#### 1-mac.1 Check and install Node.js >= 22

```bash
node -v 2>/dev/null
```

If missing or version < 22:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm in current session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node 22 and set as default
nvm install 22
nvm use 22
nvm alias default 22

# Persist to shell profile
SHELL_RC="$HOME/.zshrc"
[ -f "$HOME/.bashrc" ] && SHELL_RC="$HOME/.bashrc"
grep -q 'NVM_DIR' "$SHELL_RC" || cat >> "$SHELL_RC" << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
EOF
```

Verify: `node -v` → v22.x.x or higher

#### 1-mac.2 Set npm mirror

```bash
npm config set registry https://registry.npmmirror.com
```

#### 1-mac.3 Fix npm global permissions

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
SHELL_RC="$HOME/.zshrc"
[ -f "$HOME/.bashrc" ] && SHELL_RC="$HOME/.bashrc"
grep -q 'npm-global' "$SHELL_RC" || echo 'export PATH=~/.npm-global/bin:$PATH' >> "$SHELL_RC"
source "$SHELL_RC"
```

---

### IF Windows

> All commands in this section are PowerShell only.
> Do not use bash, sh, or Unix-style commands here.

#### 1-win.1 Set PowerShell Execution Policy

Explain to the user:
> "Windows blocks scripts by default for security. I need to allow scripts for
> your user account only — this won't affect other users or system security."

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

Verify:
```powershell
Get-ExecutionPolicy -Scope CurrentUser
# Expected: RemoteSigned
```

#### 1-win.2 Check and install Node.js >= 22

```powershell
node -v 2>$null
```

If missing or version < 22:

**Primary — winget (Windows 10 1809+ / Windows 11):**
```powershell
winget install Schniz.fnm --silent --accept-package-agreements --accept-source-agreements

# Reload PATH immediately
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH","User")
```

**Fallback — if winget is not available:**
```powershell
Invoke-WebRequest `
  -Uri "https://github.com/Schniz/fnm/releases/latest/download/fnm-windows.zip" `
  -OutFile "$env:TEMP\fnm.zip"
Expand-Archive "$env:TEMP\fnm.zip" -DestinationPath "$env:USERPROFILE\.fnm\bin" -Force
$env:PATH = "$env:USERPROFILE\.fnm\bin;" + $env:PATH
```

**After fnm is available (both methods):**
```powershell
fnm install 22
fnm use 22
fnm default 22

# Persist to PowerShell profile
if (!(Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
if (!(Select-String -Path $PROFILE -Pattern 'fnm env' -Quiet -ErrorAction SilentlyContinue)) {
    Add-Content $PROFILE 'fnm env --use-on-cd | Out-String | Invoke-Expression'
}
if (!(Select-String -Path $PROFILE -Pattern '\.fnm\\bin' -Quiet -ErrorAction SilentlyContinue)) {
    Add-Content $PROFILE '$env:PATH = "$env:USERPROFILE\.fnm\bin;" + $env:PATH'
}
```

Verify:
```powershell
node -v   # Expected: v22.x.x or higher
```

#### 1-win.3 Set npm mirror

```powershell
npm config set registry https://registry.npmmirror.com
```

> Note: npm global permission issues do not apply on Windows with fnm.
> fnm manages Node in the user's home directory — no admin rights needed.

---

### IF Linux (Ubuntu / Debian)

#### 1-linux-deb.1 Check and install Node.js >= 22

```bash
node -v 2>/dev/null
```

If missing or version < 22:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify: `node -v` → v22.x.x

#### 1-linux-deb.2 Set npm mirror
```bash
npm config set registry https://registry.npmmirror.com
```

#### 1-linux-deb.3 Fix npm global permissions
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
grep -q 'npm-global' ~/.bashrc || echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### IF Linux (CentOS / RHEL)

#### 1-linux-rpm.1 Check and install Node.js >= 22

```bash
node -v 2>/dev/null
```

If missing or version < 22:
```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
```

Verify: `node -v` → v22.x.x

#### 1-linux-rpm.2 Set npm mirror
```bash
npm config set registry https://registry.npmmirror.com
```

#### 1-linux-rpm.3 Fix npm global permissions
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
grep -q 'npm-global' ~/.bashrc || echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### 1.X Phase 1 Summary

Show the user:
```
Node.js v22.x — Ready
npm mirror configured (npmmirror.com)
Environment ready
```

If anything failed, explain in plain language and run `openclaw doctor --fix`.

---

