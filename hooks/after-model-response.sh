#!/bin/bash
#
# Claude Code Stop Hook
# 将 Claude 的最终英文响应翻译成中文并返回给 Claude Code.
#

set -euo pipefail

PLUGIN_DIR="${CLAUDE_TRANSLATOR_PLUGIN_DIR:-$HOME/.claude/plugins/claude-code-translator}"
SESSION_MARKER="$HOME/.claude/translate-session-mode"
HOOK_SCRIPT="$PLUGIN_DIR/src/stop-response-hook.js"

# 检查会话级标记文件 (claude-translate-off / claude-translate-on)
if [ -f "$SESSION_MARKER" ]; then
    SESSION_MODE=$(cat "$SESSION_MARKER")
    if [ "$SESSION_MODE" = "off" ]; then
        [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Session mode: OFF (skipping)" >&2
        exit 0
    fi
fi

# 检查环境变量设置
if [ "${TRANSLATE_ENABLED:-true}" = "false" ]; then
    [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Env TRANSLATE_ENABLED=false (skipping)" >&2
    exit 0
fi

if [ ! -f "$HOOK_SCRIPT" ]; then
    [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
    exit 0
fi

node "$HOOK_SCRIPT"