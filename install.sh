#!/bin/bash

set -e

# Claude Code Translator 安装脚本

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
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Claude Code Translator 安装向导                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 检查前置条件
log_info "检查前置条件..."

# 检查 Claude Code 目录
if [ ! -d "$CLAUDE_DIR" ]; then
    log_error "Claude Code 未安装：$CLAUDE_DIR 不存在"
    log_info "请先安装 Claude Code: npm install -g @anthropic-ai/claude-code"
    exit 1
fi
log_success "Claude Code 目录存在"

# 创建插件目录
log_info "创建插件目录..."
mkdir -p "$PLUGIN_DIR"
log_success "插件目录：$PLUGIN_DIR"

# 复制插件文件
log_info "复制插件文件..."
cp -r "$SCRIPT_DIR/src" "$PLUGIN_DIR/"
cp "$SCRIPT_DIR/package.json" "$PLUGIN_DIR/"
log_success "插件文件已复制"

# 安装依赖
log_info "安装 npm 依赖..."
cd "$PLUGIN_DIR"
if command -v npm &> /dev/null; then
    npm install --production 2>/dev/null || log_warn "npm install 失败，请手动运行：cd $PLUGIN_DIR && npm install"
else
    log_warn "未找到 npm，请手动安装依赖：cd $PLUGIN_DIR && npm install"
fi

# 合并 settings.json
log_info "配置 settings.json..."

mkdir -p "$HOOKS_DIR"

if [ -f "$SETTINGS_FILE" ]; then
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup.$(date +%Y%m%d%H%M%S)"
fi

SETTINGS_FILE="$SETTINGS_FILE" HOOK_FILE="$HOOK_FILE" STOP_HOOK_FILE="$STOP_HOOK_FILE" node <<'NODE'
const fs = require('fs');

const settingsFile = process.env.SETTINGS_FILE;
const hookFile = process.env.HOOK_FILE;

let settings = {};
if (fs.existsSync(settingsFile)) {
  const content = fs.readFileSync(settingsFile, 'utf8').trim();
  if (content) {
    try {
      settings = JSON.parse(content);
    } catch (error) {
      throw new Error(`${settingsFile} 不是合法 JSON。已保留备份，请先修复该文件后重新运行安装。${error.message}`);
    }
  }
}

settings.translator = {
  enabled: true,
  api: settings.translator?.api || 'libre',
  direction: settings.translator?.direction || 'both',
  autoDetect: settings.translator?.autoDetect ?? true,
  showOriginal: settings.translator?.showOriginal ?? false
};

settings.hooks = settings.hooks || {};
settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit || [];
settings.hooks.Stop = settings.hooks.Stop || [];

const command = hookFile;
const hasTranslatorHook = settings.hooks.UserPromptSubmit.some((entry) =>
  Array.isArray(entry.hooks) && entry.hooks.some((hook) => hook.command === command)
);

if (!hasTranslatorHook) {
  settings.hooks.UserPromptSubmit.push({
    hooks: [
      {
        type: 'command',
        command,
        timeout: 30
      }
    ]
  });
}

const stopCommand = process.env.STOP_HOOK_FILE;
const hasStopHook = settings.hooks.Stop.some((entry) =>
  Array.isArray(entry.hooks) && entry.hooks.some((hook) => hook.command === stopCommand)
);

if (!hasStopHook) {
  settings.hooks.Stop.push({
    hooks: [
      {
        type: 'command',
        command: stopCommand,
        timeout: 30
      }
    ]
  });
}

fs.writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
NODE
log_success "settings.json 已更新"

# 安装 Hook
log_info "安装输入 Hook..."
cp "$SCRIPT_DIR/hooks/before-user-message.sh" "$HOOK_FILE"
chmod +x "$HOOK_FILE"
log_success "输入 Hook 已安装"

log_info "安装输出 Hook..."
cp "$SCRIPT_DIR/hooks/after-model-response.sh" "$STOP_HOOK_FILE"
chmod +x "$STOP_HOOK_FILE"
log_success "输出 Hook 已安装"

# 显示配置说明
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    安装完成！                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "配置说明:"
echo "  翻译 API:    libre (免费)"
echo "  翻译方向：双向 (输入 + 输出)"
echo "  自动检测：已启用"
echo ""
echo "切换翻译 API:"
echo "  export TRANSLATE_API=deepl   # DeepL (高质量)"
echo "  export TRANSLATE_API=google  # Google Translate"
echo "  export TRANSLATE_API=baidu   # 百度翻译"
echo "  export TRANSLATE_API=ollama  # 本地模型"
echo ""
echo "环境变量:"
echo "  export DEEPL_API_KEY=xxx     # DeepL API Key"
echo "  export GOOGLE_API_KEY=xxx    # Google API Key"
echo "  export BAIDU_APP_ID=xxx      # 百度 App ID"
echo "  export BAIDU_SECRET_KEY=xxx  # 百度密钥"
echo ""
echo "调试模式:"
echo "  export DEBUG=translator"
echo ""
echo "下一步:"
echo "  1. 重启 Claude Code"
echo "  2. 输入中文测试，如：\"帮我写个 Python 脚本\""
echo ""
log_success "安装完成！"
echo ""
