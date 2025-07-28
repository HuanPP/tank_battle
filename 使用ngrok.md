# 使用ngrok内网穿透

## 安装ngrok
1. 访问 https://ngrok.com/ 注册账号
2. 下载ngrok客户端
3. 配置authtoken: `ngrok authtoken <your-token>`

## 启动游戏服务
```bash
# 在游戏目录下启动简单HTTP服务器
python3 -m http.server 8000

# 或者用Node.js
npx serve -s . -l 8000
```

## 启动ngrok
```bash
ngrok http 8000
```

ngrok会给你一个公网地址，如：https://xxx.ngrok.io
把这个地址分享给其他人即可！