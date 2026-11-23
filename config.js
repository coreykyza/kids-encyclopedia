/**
 * 站点配置占位。正式预览/发布时由平台注入真实 site_id 与 data_api_base。
 * 浏览器预览由工具临时注入配置并原样恢复；冒烟测试直接请求本地 KV 服务，不修改本文件或 dist/config.js。
 * 必须 ESM：import { startKvServer } from '../scripts/kv-server.mjs'
 * 不要把生产 URL / Token 写进本文件。
 */
window.__INNOFLOW_SITE__ = window.__INNOFLOW_SITE__ || {
  site_id: "",
  data_api_base: ""
};
