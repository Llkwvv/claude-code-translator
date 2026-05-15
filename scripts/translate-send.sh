#!/bin/bash
#
# 翻译并发送给 Claude Code
# 用法: translate-send "中文内容"
#

TEXT="$1"

if [ -z "$TEXT" ]; then
  echo "用法: translate-send \"中文内容\""
  exit 1
fi

# 翻译
TRANSLATED=$(node -e "
const Translator = require('./src/translator');
const t = new Translator({api: 'libre'});
t.toEnglish('$TEXT').then(r => console.log(r));
" 2>/dev/null)

if [ -z "$TRANSLATED" ] || [ "$TRANSLATED" = "$TEXT" ]; then
  echo "翻译失败，请检查网络"
  exit 1
fi

echo "翻译结果: $TRANSLATED"
echo "发送中..."

# 发送给 Claude Code
echo "$TRANSLATED" | claude -p
