# 交接材料索引

本目录用于把「小小百科探险家」项目移交给其他开发/AI 助手。只需按下面的顺序读，不必先看全仓代码。

## 一、先读这三份

| 文件 | 作用 | 体量 |
| --- | --- | --- |
| `项目交接说明.md` | 主文档（十二节）：项目定位、技术栈、运行方式、目录结构、20 主题内容规格、数据与进度持久化、配音方案、验收清单、已知问题与规范、常见改动指引 | 约 16 KB |
| `主题内容数据.json` | 20 个主题的全部文案数据（每主题 4 热点 / 3 题 / 4 配对 / 3 故事），可直接程序化读取 | 约 78 KB |
| `文件清单.json` | 全仓文件台账（256 文件 / 11.4 MB），含分类、字节数、用途 | 约 28 KB |

## 二、接手后 3 分钟验证

```
node tests/smoke.test.js      # 应输出 static js smoke ok / kv smoke ok
```

浏览器直接打开根目录 `index.html` 即可（纯静态，无需构建）。带平台进度存储时用 `python3 -m http.server` 之类的本地服务 + `scripts/kv-server.mjs`。

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
