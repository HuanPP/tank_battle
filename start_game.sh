#!/bin/bash

echo "🎮 坦克大战游戏启动器"
echo "===================="
echo ""
echo "选择启动方式："
echo "1. Python HTTP服务器（端口8000）"
echo "2. 打开游戏文件夹"
echo "3. 显示ngrok使用说明"
echo ""
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "🚀 启动Python HTTP服务器..."
        echo "游戏地址: http://localhost:8000"
        echo "按 Ctrl+C 停止服务器"
        echo ""
        python3 -m http.server 8000
        ;;
    2)
        echo "📁 打开游戏文件夹..."
        open .
        ;;
    3)
        echo "📖 ngrok使用说明："
        echo ""
        echo "1. 注册并安装ngrok: https://ngrok.com/"
        echo "2. 先运行选项1启动本地服务器"
        echo "3. 在新终端中运行: ngrok http 8000"
        echo "4. 复制ngrok提供的公网地址分享给朋友"
        echo ""
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac