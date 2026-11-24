#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 运营物料/gen.html 的 8 个 sheet 逐块截成闲鱼图。
用法：python3 运营物料/shot-xianyu.py
产出：运营物料/闲鱼图/01-主图.png ... 08-使用说明.png
主图 800x800，详情图 800x1067。参考数学小课堂同款做法。
"""
import os
import subprocess

from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(ROOT, "闲鱼图")
NAMES = [
    "01-主图", "02-世界地图", "03-点选探索", "04-问答闯关",
    "05-配对游戏", "06-情景故事", "07-内容清单", "08-使用说明",
]
SIZES = [(800, 800)] + [(800, 1067)] * 7
TMP_HTML = os.path.join(ROOT, "_xianyu_sheet.html")


def shot(idx, name, w, h):
    src = open(os.path.join(ROOT, "gen.html"), encoding="utf-8").read()
    inject = """
<script>
window.addEventListener('load', function(){
  var sheets=document.querySelectorAll('.sheet');
  sheets.forEach(function(s,i){
    if(i!==%d) s.style.display='none';
    else { s.style.position='absolute'; s.style.left='0'; s.style.top='0'; }
  });
  document.body.style.background='#fff';
  document.body.style.gap='0';
  document.title='READY';
});
</script>
""" % idx
    src = src.replace("</body>", inject + "</body>")
    open(TMP_HTML, "w", encoding="utf-8").write(src)
    raw = "/tmp/xianyu-sheet-%d.png" % idx
    subprocess.run([
        CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--no-proxy-server",
        "--user-data-dir=/tmp/xianyu-shot-prof", "--disk-cache-size=0",
        "--window-size=%d,%d" % (max(500, w), h + 200), "--force-device-scale-factor=1",
        "--virtual-time-budget=6000", "--screenshot=" + raw, "file://" + TMP_HTML,
    ], capture_output=True, text=True, timeout=120)
    im = Image.open(raw)
    dst = os.path.join(OUT, name + ".png")
    im.crop((0, 0, w, h)).save(dst)
    print("  %s: %dx%d -> %dKB" % (name, w, h, os.path.getsize(dst) // 1024))


def main():
    os.makedirs(OUT, exist_ok=True)
    print("闲鱼物料生成：")
    for i, (name, (w, h)) in enumerate(zip(NAMES, SIZES)):
        shot(i, name, w, h)
    print("产出目录：" + OUT)


if __name__ == "__main__":
    main()
