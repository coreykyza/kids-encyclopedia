# 孩子百科全书（小小百科探险家）

面向 5-7 岁孩子的网页百科探险应用：20 个主题的世界地图 + 点选探索 + 问答闯关 + 拖拽配对 + 情景小故事 + 收集奖励。全部内容内置，226 条中文童声配音，纯静态、免安装。

## 线上地址

- GitHub Pages（主要使用）：https://coreykyza.github.io/kids-encyclopedia/
- 平台预览（带云端进度存储）：https://eduapp.coraccoon.com/ysj53t6px1mc/ （有效期至 2027-05-23）

## 产研流程

本项目按产研流水线执行：需求访谈 → 需求文档 → 线框图 → 高保真原型 → 需求审核 → 测试用例冻结 → 正式开发 → 测试循环 → 版本发布 → 部署上线。当前 v2.0 已交付上线。

- `docs/需求文档.md`：v2.0 现行基线（20 主题 / 226 配音）
- `docs/测试用例.md`：v2.0 回归用例集
- `docs/产研流程状态.md`：已交付上线
- `docs/线框图.html`：页面骨架（20 主题版）
- `prototype/index.html`：可交互高保真原型

## 本地运行

双击 `index.html` 即可（`file://` 可用，进度存浏览器本地）；或起静态服务：

```bash
python3 -m http.server 8000
```

## 回归检查

改内容或配音后必须跑：

```bash
node tools/verify-assets.cjs    # 20 主题结构 / 226 配音 / 20 封面 / logic 双文件同步
```

## 交接材料

接手本项目（含由其他 AI 助手接手）请先读 `docs/handover/README.md`：

- `docs/handover/项目交接说明.md`：主文档（十二节），含目录结构、内容规格、存储、配音、验收、已知问题与改动指引
- `docs/handover/主题内容数据.json`：20 主题全量文案（4 热点 / 3 题 / 4 配对 / 3 故事）
- `docs/handover/文件清单.json`：正式站点台账（271 文件 / 11.6 MB，不含 prototype）

## 闲鱼上架物料

`运营物料/` 含 8 张闲鱼图 + 上架文案 + 作图源文件，对标拼音/数学小课堂同款打法：

- `运营物料/index.html`：物料预览页
- `运营物料/闲鱼上架文案.md`：标题 / 描述 / 定价 / 自动发货 / FAQ / 风险 / 上架清单
- `运营物料/shot-xianyu.py`：重新生成 8 张图（`python3 运营物料/shot-xianyu.py`）

上架前必做：**手机流量（关 WiFi）实测线上链接可达**，GitHub Pages 国内时好时坏。

## 变更池

见 `CHANGELOG.md`。
