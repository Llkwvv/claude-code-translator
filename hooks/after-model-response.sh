#!/bin/bash
#
# Claude Code Stop Hook
# 将 Claude 的最终英文响应翻译成中文并返回给 Claude Code.
#

set -euo pipefail

# 如果 TRANSLATE_ENABLED=false，跳过翻译直接放行
if [ "${TRANSLATE_ENABLED:-true}" = "false" ]; then
    exit 0
fi

PLUGIN_DIR="${CLAUDE_TRANSLATOR_PLUGIN_DIR:-$HOME/.claude/plugins/claude-code-translator}"
HOOK_SCRIPT="$PLUGIN_DIR/src/stop-response-hook.js"

if [ ! -f "$HOOK_SCRIPT" ]; then
    [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
    exit 0
fi

node "$HOOK_SCRIPT"
