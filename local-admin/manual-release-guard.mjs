// Git发布同样核对私密说明书来源；此模块只读业务资料，最终来源锁只覆盖实际切站。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {createSubmissionStore} from './submissions.mjs';
import {manualPublicationInput,normalizeManualDraft} from './manuals.mjs';
import {projectManualCatalog} from '../shared/manual-catalog.mjs';
import {safeBytes,safeDirectory} from './archive-merge-files.mjs';

const empty=()=>({schema_version:1,brands:[],models:[],documents:[]});
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=message=>{throw Object.assign(new Error(message),{name:'ManualReleaseError',statusCode:409,code:'MANUAL_RELEASE_SOURCE_CONFLICT'});};
const absolute=(value,label)=>{if(typeof value!=='string'||!value||!path.isAbsolute(value))fail(`${label}必须是明确的绝对路径。`);return path.resolve(value);};
const read=async(root,relative,{optional=false}={})=>{
  try{
    const stat=await fs.lstat(path.join(root,relative));
    if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)fail('说明书发布核对文件不能使用链接或特殊文件。');
    return await safeBytes(root,relative);
  }catch(error){if(optional&&error.code==='ENOENT')return null;throw error;}
};
const parsed=(bytes,label)=>{try{return JSON.parse(bytes);}catch{fail(`${label}无法读取，不能切换公开版本。`);}};

export async function prepareManualReleaseGuard({adminDataRoot,submissionRoot,archiveDataDirectory,siteDirectory}){
  const site=absolute(siteDirectory,'网站目录'),sourceRelative='src/data/generated/manuals-catalog.json';
  if(adminDataRoot===undefined||adminDataRoot===null){
    if(submissionRoot!==undefined||archiveDataDirectory!==undefined)fail('说明书私密目录配置不完整，不能继续发布。');
    const raw=await read(site,sourceRelative,{optional:true}),source=raw?parsed(raw,'公开说明书目录'):empty();
    if(!isDeepStrictEqual(projectManualCatalog(source,[]),projectManualCatalog(empty(),[]))||source.documents.length||source.models.length||source.brands.length)fail('候选版本含说明书资料，但没有配置可核对的私密来源目录。');
    const validate=async()=>{if(!isDeepStrictEqual(await read(site,sourceRelative,{optional:true}),raw))fail('候选说明书目录在发布期间已变化。');};
    return {records:[],validate,withCommit:async commit=>{await validate();return commit();}};
  }
  const privateRoot=absolute(adminDataRoot,'管理私密目录'),submissions=absolute(submissionRoot??path.join(privateRoot,'submissions'),'投稿目录'),archivesDirectory=absolute(archiveDataDirectory??path.join(privateRoot,'archive-data'),'正式档案目录');
  await safeDirectory(privateRoot);await safeDirectory(submissions);await safeDirectory(archivesDirectory);
  const stateRelative='manuals/state.json';
  const inputs=async()=>{
    const archives=[],files=[];
    for(const entry of (await fs.readdir(archivesDirectory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
      if(!/^LJM-.*\.json$/i.test(entry.name))continue;
      if(!/^LJM-\d{8}-[A-Z]{3}-\d{3}\.json$/.test(entry.name))fail('正式档案文件名无法核对。');
      const bytes=await read(archivesDirectory,entry.name),record=parsed(bytes,'正式档案');
      if(record?.core?.item_id+'.json'!==entry.name)fail('正式档案编号与文件名不一致。');
      archives.push(record);files.push([entry.name,hash(bytes)]);
    }
    const stateBytes=await read(privateRoot,stateRelative,{optional:true}),sourceBytes=await read(site,sourceRelative,{optional:true});
    let catalog=empty();
    if(stateBytes){const state=parsed(stateBytes,'私密说明书维护记录');if(state.version!==1||!state.published)fail('私密说明书维护记录无法核对。');catalog=normalizeManualDraft(state.published);}
    const source=sourceBytes?parsed(sourceBytes,'公开说明书目录'):empty();
    const expected=projectManualCatalog(manualPublicationInput(catalog),archives),actual=projectManualCatalog(source,archives);
    if(!isDeepStrictEqual(expected,actual))fail('候选公开说明书目录与私密正式目录不一致，不能发布旧构建。');
    return {archives,catalog,fingerprint:JSON.stringify({files,state:stateBytes?hash(stateBytes):null,source:sourceBytes?hash(sourceBytes):null})};
  };
  // 不让all()把链接目录当作普通投稿读取；不创建缺失的私密业务目录。
  for(const entry of await fs.readdir(submissions,{withFileTypes:true})){
    if(!/^TG-[A-F0-9]{24}$/.test(entry.name))continue;
    if(!entry.isDirectory()||entry.isSymbolicLink())fail('说明书投稿目录不能使用文件链接。');
    await read(submissions,entry.name+'/record.json');
  }
  const before=await inputs(),store=createSubmissionStore({root:submissions,siteDirectory:site});
  const archives=before.archives.filter(record=>record.core.record_status==='ACT'&&record.core.privacy_level==='G'&&record.core.use_status==='U3');
  const archiveGuard=await store.prepareManualPublication(archives),verifiedRecords=[];
  if((await store.manualCatalogPublicationIssues(before.catalog,{verifiedRecords})).length)fail('说明书投稿审核、停止处理状态或提供范围无法通过核对。');
  const guard=store.createPublicationGuard([...archiveGuard.records,...verifiedRecords],{additionalGuards:[archiveGuard]});
  const validate=async()=>{if((await inputs()).fingerprint!==before.fingerprint)fail('正式档案或说明书目录在候选准备期间已变化。');await guard.validate();};
  await validate();
  return {records:guard.records,validate,withCommit:commit=>guard.withCommit(async()=>{await validate();return commit();})};
}
