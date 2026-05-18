#!/bin/bash
#
# Claude Code Stop Hook
# 将 Claude 的最终英文响应翻译成中文并返回给 Claude Code.
#

set -euo pipefail

PLUGIN_DIR="${CLAUDE_TRANSLATOR_PLUGIN_DIR:-$HOME/.claude/plugins/claude-code-translator}"
SESSION_MARKER="$HOME/.claude/translate-session-mode"
TRANSLATE_SESSION_ID="${CLAUDE_SESSION_ID:-}"
HOOK_SCRIPT="$PLUGIN_DIR/src/stop-response-hook.js"

# 会话级控制: 检查 CLAUDE_SESSION_ID 对应的临时标记文件
if [ -n "$TRANSLATE_SESSION_ID" ]; then
    SESSION_FILE="$HOME/.claude/translate-session-$TRANSLATE_SESSION_ID"
    if [ -f "$SESSION_FILE" ]; then
        SESSION_MODE=$(cat "$SESSION_FILE")
        if [ "$SESSION_MODE" = "off" ]; then
            [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Session $TRANSLATE_SESSION_ID: OFF (skipping)" >&2
            exit 0
        elif [ "$SESSION_MODE" = "on" ]; then
            [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Session $TRANSLATE_SESSION_ID: ON (forcing enabled)" >&2
            if [ ! -f "$HOOK_SCRIPT" ]; then
                [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
                exit 0
            fi
            node "$HOOK_SCRIPT"
            exit 0
        fi
    fi
fi

# 回退到全局标记文件 (兼容旧版)
if [ -f "$SESSION_MARKER" ]; then
    SESSION_MODE=$(cat "$SESSION_MARKER")
    if [ "$SESSION_MODE" = "off" ]; then
        [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Global mode: OFF (skipping)" >&2
        exit 0
    elif [ "$SESSION_MODE" = "on" ]; then
        [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Global mode: ON (forcing enabled)" >&2
        if [ ! -f "$HOOK_SCRIPT" ]; then
            [ "${DEBUG:-}" = "translator" ] && echo "[Translator] Hook script not found: $HOOK_SCRIPT" >&2
            exit 0
        fi
        node "$HOOK_SCRIPT"
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