# 交接材料索引

本目录用于把「小小百科探险家」项目移交给其他开发/AI 助手。只需按下面的顺序读，不必先看全仓代码。

## 一、先读这三份

| 文件 | 作用 | 体量 |
| --- | --- | --- |
| `项目交接说明.md` | 主文档（十二节）：项目定位、技术栈、运行方式、目录结构、20 主题内容规格、数据与进度持久化、配音方案、验收清单、已知问题与规范、常见改动指引 | 约 16 KB |
| `主题内容数据.json` | 20 个主题的全部文案数据（每主题 4 热点 / 3 题 / 4 配对 / 3 故事），可直接程序化读取 | 约 78 KB |
| `文件清单.json` | 正式站点文件台账（271 文件 / 11.6 MB，不含 prototype/），含分类、字节数 | 约 30 KB |

> 2026-11-24 校准：`主题内容数据.json` 已由 `js/logic.js` 直接导出，与代码逐字段一致；`文件清单.json` 按实际仓库重新生成。原交接包中的 `scripts/kv-server.mjs`、`tests/smoke.test.js` 未随仓库提供，已由 `tools/verify-assets.cjs` 替代资产回归部分。

## 二、接手后 3 分钟验证

```
node tools/verify-assets.cjs    # 应输出 verify-assets ok
```

该脚本检查：20 主题 × 4/3/4/3 结构、热点 id 规范、每题唯一正确项、20 张封面（≤70KB）、226 条配音齐全、`logic.js`/`logic.mjs` 同步。

浏览器直接打开根目录 `index.html` 即可（纯静态，无需构建）。带平台进度存储时平台会注入 `config.js` 的 `site_id` 与 `data_api_base`；本地开发只需 `python3 -m http.server 8000`。

## 三、硬约束（改动前务必先看）

- `index.html`、`play.html` 必须用经典 `<script src>`，不能改 `type="module"`。
- `js/logic.mjs` 仅给测试用，必须与 `js/logic.js` 同步导出。
- 配音走 `assets/voice/{key}.mp3`，加载失败才回退浏览器语音合成，不要删回退。
- 进度持久化三级降级（localStorage → sessionStorage → 内存），`mergeProgress` 不能简化。
- 20 主题 × (4 热点 / 3 题 / 4 配对 / 3 故事) 的内容结构不要随意增删，配音与内容一一对应。
- 首页封面图规范：860×484、单张 ≤ 70 KB。

## 四、其它位置

- 需求与流程：`docs/需求文档.md`、`docs/测试用例.md`、`docs/产研流程状态.md`、`docs/线框图.html`
- 变更记录：`CHANGELOG.md`
- 可交互原型：`prototype/`
- 线上地址：https://eduapp.coraccoon.com/ysj53t6px1mc/
- 仓库镜像：https://github.com/coreykyza/kids-encyclopedia
