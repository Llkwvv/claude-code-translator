#!/bin/bash
#
# Claude Code UserPromptSubmit Hook
# Reads hook input JSON from stdin and adds the English translation as context.
#

set -euo pipefail

PLUGIN_DIR="${CLAUDE_TRANSLATOR_PLUGIN_DIR:-$HOME/.claude/plugins/claude-code-translator}"
HOOK_SCRIPT="$PLUGIN_DIR/src/user-prompt-hook.js"

if [ ! -f "$HOOK_SCRIPT" ]; then
    [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
    exit 0
fi

node "$HOOK_SCRIPT"
