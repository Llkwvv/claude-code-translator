---
name: translate-toggle
description: Toggle translation hooks on/off for the current Claude Code session
license: MIT
compatibility: Requires claude-code-translator plugin
metadata:
  author: Claude Code Translator
  version: "1.0"
  generatedBy: "claude-code-translator"
---

Toggle translation hooks on/off for the current Claude Code session.

This command controls whether the translation plugin (Chinese ↔ English) is active for your current session.

## Usage

```
/translate-toggle
```

## What It Does

- Toggles the translation state between **enabled** and **disabled**
- Creates/updates a session marker file at `~/.claude/translate-session-<session-id>`
- The hooks (`before-user-message.sh` and `after-model-response.sh`) check this marker to determine if they should run
- State persists for the duration of your Claude Code session

## Visual Feedback

After running the command, you'll see:
- ✅ **Translator enabled** — Chinese inputs will be translated to English for Claude, and English responses will be translated to Chinese for you
- 🚫 **Translator disabled** — Messages pass through unchanged (no translation)
- Current state is also shown (on/off)

## Examples

```
/translate-toggle
✅ Translator enabled for this session
   Current mode: on

/translate-toggle
🚫 Translator disabled for this session
   Current mode: off
```

## Session-Specific Control

Each Claude Code window/session has its own independent translation state. Toggling in one session doesn't affect others.

## Manual Control (Alternative)

You can also control translation from your terminal:

```bash
# Enable translation for current session
claude-translate-on

# Disable translation for current session
claude-translate-off

# Toggle translation state
claude-translate-toggle
```

## Technical Details

- State is stored in `~/.claude/translate-session-<CLAUDE_SESSION_ID>`
- The hook scripts check: session marker → global marker → environment variable
- Translation uses local Ollama (qwen2.5:0.5b) by default, with fallback to LibreTranslate
