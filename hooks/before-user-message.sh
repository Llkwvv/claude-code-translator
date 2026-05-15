#!/bin/bash
#
# Claude Code UserPromptSubmit Hook
# Reads hook input JSON from stdin and adds the English translation as context.
#

set -euo pipefail

PLUGIN_DIR="${CLAUDE_TRANSLATOR_PLUGIN_DIR:-$(cd "$(dirname "$0")" && pwd)}"
SESSION_MARKER="$HOME/.claude/translate-session-mode"
HOOK_SCRIPT="$PLUGIN_DIR/src/user-prompt-hook.js"

# 检查会话级标记文件 (claude-translate-off / claude-translate-on)
# 优先级最高: 会话标记
if [ -f "$SESSION_MARKER" ]; then
    SESSION_MODE=$(cat "$SESSION_MARKER")
    if [ "$SESSION_MODE" = "off" ]; then
        [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Session mode: OFF (skipping)" >&2
        exit 0
    elif [ "$SESSION_MODE" = "on" ]; then
        [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Session mode: ON (forcing enabled)" >&2
        # 继续执行翻译，忽略 TRANSLATE_ENABLED 设置
        if [ ! -f "$HOOK_SCRIPT" ]; then
            [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
            exit 0
        fi
        node "$HOOK_SCRIPT"
        exit 0
    fi
fi

# 检查环境变量设置 (仅当没有会话标记时)
if [ "${TRANSLATE_ENABLED:-true}" = "false" ]; then
    [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Env TRANSLATE_ENABLED=false (skipping)" >&2
    exit 0
fi

if [ ! -f "$HOOK_SCRIPT" ]; then
    [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
    exit 0
fi

node "$HOOK_SCRIPT"