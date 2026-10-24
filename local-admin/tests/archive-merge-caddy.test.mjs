import test from 'node:test';
import assert from 'node:assert/strict';
import {removeLegacy019Redirects} from '../../deployment/archive-merge-caddy.mjs';
const routes=['','/en','/th','/ja','/ko','/zh-hant'].map((prefix,i)=>` @ljm_merge_019_${i} {\n  host laojiumopian.com\n  method GET HEAD\n  path ${prefix}/archive/LJM-20260910-LET-019 ${prefix}/archive/LJM-20260910-LET-019/\n }\n redir @ljm_merge_019_${i} "${prefix}/archive/LJM-20260910-LET-020/#image-2" 302\n`).join('');
test('仅迁移六个核实旧跳转，其他配置及换行保留，可重复执行',()=>{for(const newline of ['\n','\r\n']){const before='laojiumopian.com {\n'+routes+' root * /srv/live\n}\n',source=before.replaceAll('\n',newline),result=removeLegacy019Redirects(source);assert.equal(result.count,6);assert.equal(result.text,('laojiumopian.com {\n root * /srv/live\n}\n').replaceAll('\n',newline));assert.equal(removeLegacy019Redirects(result.text).changed,false);}});
test('目标、主机或数量不符时不猜测，不移除未知规则',()=>{for(const source of [routes.replace('host laojiumopian.com','host other.example'),routes.replace('/#image-2','/#image-1'),routes.slice(routes.indexOf(' @ljm_merge_019_1'))])assert.throws(()=>removeLegacy019Redirects(source));});
