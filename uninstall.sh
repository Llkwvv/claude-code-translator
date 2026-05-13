#!/bin/bash

set -e

# Claude Code Translator 卸载脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="claude-code-translator"
CLAUDE_DIR="$HOME/.claude"
PLUGIN_DIR="$CLAUDE_DIR/plugins/$PLUGIN_NAME"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
HOOKS_DIR="$CLAUDE_DIR/hooks"
HOOK_FILE="$HOOKS_DIR/before-user-message.sh"
STOP_HOOK_FILE="$HOOKS_DIR/after-model-response.sh"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Claude Code Translator 卸载向导                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 删除插件目录
log_info "删除插件文件..."
if [ -d "$PLUGIN_DIR" ]; then
    rm -rf "$PLUGIN_DIR"
    log_success "插件目录已删除"
else
    log_warn "插件目录不存在"
fi

# 删除 Hook
log_info "删除 Hook..."
rm -f "$HOOKS_DIR/before-user-message.sh" 2>/dev/null || true
rm -f "$HOOKS_DIR/after-model-response.sh" 2>/dev/null || true
log_success "Hook 已删除"

# 清理 settings.json
log_info "清理 settings.json..."
if [ -f "$SETTINGS_FILE" ]; then
    # 备份
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup.$(date +%Y%m%d%H%M%S)"

    SETTINGS_FILE="$SETTINGS_FILE" HOOK_FILE="$HOOK_FILE" STOP_HOOK_FILE="$STOP_HOOK_FILE" node <<'NODE'
const fs = require('fs');

const settingsFile = process.env.SETTINGS_FILE;
const hookFile = process.env.HOOK_FILE;
const stopHookFile = process.env.STOP_HOOK_FILE;

let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
} catch (error) {
  throw new Error(`${settingsFile} 不是合法 JSON，无法自动清理：${error.message}`);
}

delete settings.translator;

if (settings.hooks && Array.isArray(settings.hooks.UserPromptSubmit)) {
  settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit
    .map((entry) => ({
      ...entry,
      hooks: Array.isArray(entry.hooks)
        ? entry.hooks.filter((hook) => hook.command !== hookFile)
        : entry.hooks
    }))
    .filter((entry) => Array.isArray(entry.hooks) && entry.hooks.length > 0);

  if (settings.hooks.UserPromptSubmit.length === 0) {
    delete settings.hooks.UserPromptSubmit;
  }
}

if (settings.hooks && Array.isArray(settings.hooks.Stop)) {
  settings.hooks.Stop = settings.hooks.Stop
    .map((entry) => ({
      ...entry,
      hooks: Array.isArray(entry.hooks)
        ? entry.hooks.filter((hook) => hook.command !== stopHookFile)
        : entry.hooks
    }))
    .filter((entry) => Array.isArray(entry.hooks) && entry.hooks.length > 0);

  if (settings.hooks.Stop.length === 0) {
    delete settings.hooks.Stop;
  }
}

if (settings.hooks && Object.keys(settings.hooks).length === 0) {
  delete settings.hooks;
}

fs.writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
NODE
    log_success "settings.json 已清理"
fi

echo ""
log_success "卸载完成！"
echo ""
echo "如需重新安装，运行："
echo "  ./install.sh"
echo ""
