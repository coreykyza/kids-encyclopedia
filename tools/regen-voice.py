#!/usr/bin/env python3
"""
全量重录 226 条配音为晓伊童声，并校验结果。

用法：
    # 1. 从代码提取文案（Node）
    node tools/extract-voice-texts.cjs        # 生成 /tmp/voice_texts.json
    # 2. 重录到临时目录（不直接覆盖）
    python3 tools/regen-voice.py /tmp/voice_new
    # 3. 校验通过后覆盖
    cp /tmp/voice_new/*.mp3 assets/voice/

依赖：edge-tts（pip install edge-tts）
参数：zh-CN-XiaoyiNeural，rate=-10%，不要改（音色一致性的硬约束）
"""
import asyncio
import json
import os
import sys

import edge_tts

VOICE = "zh-CN-XiaoyiNeural"
RATE = "-10%"
MAP_PATH = "/tmp/voice_texts.json"


async def main():
    texts = json.load(open(MAP_PATH, encoding="utf-8"))
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "/tmp/voice_new"
    os.makedirs(out_dir, exist_ok=True)
    sem = asyncio.Semaphore(5)

    async def gen(key, text):
        dst = os.path.join(out_dir, key + ".mp3")
        c = edge_tts.Communicate(text, VOICE, rate=RATE)
        await c.save(dst)
        return key, os.path.getsize(dst)

    async def task(item):
        key, text = item
        for attempt in range(4):
            try:
                async with sem:
                    return await gen(key, text)
            except Exception as e:
                if attempt == 3:
                    return key, "FAIL: " + str(e)[:80]
                await asyncio.sleep(1.5 * (attempt + 1))

    results = await asyncio.gather(*(task(i) for i in texts.items()))
    fails = [r for r in results if isinstance(r[1], str)]
    sizes = [r[1] for r in results if not isinstance(r[1], str)]
    print(f"生成 {len(results)} 条 | 成功 {len(sizes)} | 失败 {len(fails)}")
    for f in fails:
        print("  FAIL", f)
    if sizes:
        print(f"大小 {min(sizes)}-{max(sizes)} B | 总计 {round(sum(sizes)/1024)} KB")
    if fails:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
