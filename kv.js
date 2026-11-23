/**
 * 平台三维 KV 客户端。由 web-project-scaffold-kv 复制到项目根 kv.js，不要改 URL 规则。
 * 依赖：页面先加载 config.js，注入 window.__INNOFLOW_SITE__。
 */
(function (global) {
  var PUBLIC_USER = "_public";
  var KEY_RE = /^[A-Za-z0-9._:~-]{1,128}$/;
  var USER_RE = /^[A-Za-z0-9._-]{1,64}$/;

  function cfg() {
    return global.__INNOFLOW_SITE__ || {};
  }

  function ready() {
    var c = cfg();
    return !!(c.site_id && c.data_api_base);
  }

  function userId() {
    var c = cfg();
    if (!c.site_id) {
      throw new Error("InnoflowKV: missing site_id");
    }
    var k = "innoflow.site.uid." + c.site_id;
    var id = global.localStorage.getItem(k);
    if (!id) {
      id = global.crypto.randomUUID();
      global.localStorage.setItem(k, id);
    }
    return id;
  }

  function assertUser(user) {
    if (typeof user !== "string" || !USER_RE.test(user)) {
      throw new Error("InnoflowKV: invalid user_id；必须为 1～64 位字母、数字或 ._-，使用 userId() 或 PUBLIC");
    }
  }

  function assertKey(key) {
    // 键是稳定标识，任意业务文本应保留在 value，不自动清洗以免产生键冲突。
    if (typeof key !== "string" || !KEY_RE.test(key)) {
      throw new Error("InnoflowKV: invalid key " + JSON.stringify(String(key).slice(0, 160))
        + "；必须为 1～128 位字母、数字或 ._:~-；使用合法稳定 ID，业务字段放入 value");
    }
  }

  function itemUrl(user, key) {
    var base = cfg().data_api_base.replace(/\/$/, "");
    assertUser(user);
    assertKey(key);
    return (
      base +
      "/kv/users/" +
      encodeURIComponent(user) +
      "/keys/" +
      encodeURIComponent(key)
    );
  }

  function listUrl(user, opts) {
    var base = cfg().data_api_base.replace(/\/$/, "");
    assertUser(user);
    var u = new URL(base + "/kv/users/" + encodeURIComponent(user));
    opts = opts || {};
    if (opts.prefix) u.searchParams.set("prefix", opts.prefix);
    if (opts.limit) u.searchParams.set("limit", String(opts.limit));
    if (opts.cursor) u.searchParams.set("cursor", opts.cursor);
    if (opts.include_value === false) u.searchParams.set("include_value", "false");
    return u.toString();
  }

  function kvPut(user, key, value) {
    return fetch(itemUrl(user, key), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    }).then(function (res) {
      if (!res.ok) throw new Error("kv put failed: " + res.status);
      // 完整接收确认响应后才结束保存，避免成功提示后的刷新中断尚未读完的响应。
      return res.text().then(function () {});
    });
  }

  function kvGet(user, key) {
    return fetch(itemUrl(user, key)).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("kv get failed: " + res.status);
      var ct = res.headers.get("Content-Type") || "";
      if (ct.indexOf("json") >= 0) return res.json();
      return res.text();
    });
  }

  function kvDel(user, key) {
    return fetch(itemUrl(user, key), { method: "DELETE" }).then(function (res) {
      if (!res.ok) throw new Error("kv delete failed: " + res.status);
      // 删除也遵循同一确认边界，调用方可安全等待后再导航。
      return res.text().then(function () {});
    });
  }

  function kvList(user, opts) {
    return fetch(listUrl(user, opts)).then(function (res) {
      if (!res.ok) throw new Error("kv list failed: " + res.status);
      return res.json().then(function (body) {
        if (body && body.code === 0 && body.data) return body.data;
        return body;
      });
    });
  }

  global.InnoflowKV = {
    PUBLIC: PUBLIC_USER,
    ready: ready,
    userId: userId,
    get: kvGet,
    put: kvPut,
    del: kvDel,
    list: kvList,
  };
})(window);
