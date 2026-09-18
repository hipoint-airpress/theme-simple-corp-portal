import {defineConfig} from "vite";
import {createRequire} from "node:module";

// 必须走插件的 CJS 入口。它的 ESM 产物(@purge-icons/core 的 index.mjs)把内部的
// require() 编译成了 `Dynamic require ... is not supported` 抛错 shim,两条本地集合
// 加载路径全部失效,只剩 axios 去 raw.githubusercontent.com 拉图标数据(且无超时,
// 网络抖动就是整个 build 挂死)。其 exports map 为 import->mjs(坏)/require->js(好),
// 所以这里用 createRequire 显式加载 CJS 版本,让本地 @iconify/json 生效。
const require = createRequire(import.meta.url);
const PurgeIcons = (m => m.default ?? m)(require('vite-plugin-purge-icons'));

// 模板使用 iconify 运行时写法 <i class="iconify" data-icon="mdi:heart">。
// 默认抽取器会匹配任意 prefix:name 形式,把 Alpine 的 x-transition:enter 误判成
// Ionicons 的 ion:enter,进而联网拉取该集合;这里只认 data-icon 属性里的 mdi。
const DATA_ICON_RE = /data-icon="(mdi:[a-z0-9]+(?:-[a-z0-9]+)*)"/g;

export default defineConfig({
    plugins: [PurgeIcons({
        content: [
            './*.tmpl',
            './module/**/*.tmpl',
        ],
        defaultExtractor: {
            extensions: ['*'],
            extractor: (raw: string) => Array.from(raw.matchAll(DATA_ICON_RE), (m) => m[1]),
        },
        // 只用本地 @iconify/json:缺集合时构建立刻报错,而不是静默联网。
        iconSource: 'local',
    })],
    build: {
        lib: {
            entry: "src/main.ts",
            name: "main",
            fileName: "main",
            formats: ["iife"],
        },
    },
});
