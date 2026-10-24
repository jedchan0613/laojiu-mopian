import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {fixture,projectRoot,actor} from './merge-fixture.mjs';
import {createAccountStore} from '../../accounts.mjs';
import {createMergePlanner} from '../../archive-merge-plans.mjs';
import {createMergeReferenceInspector} from '../../archive-merge-references.mjs';
import {createArchiveMergeExecution} from '../../archive-merge-execution.mjs';
import {createMergeImageValidator} from '../../archive-merge-runtime.mjs';
import {recordRevision} from '../../write-coordinator.mjs';
import {archiveSourceForRecords} from '../../../shared/archive-merge-projection.mjs';
import {treeDigest} from '../../archive-merge-files.mjs';

export async function executionFixture(t,options={}){
 const f=await fixture(null,{count:3});let store,db;
 t.after(async()=>{db?.close();store?.close();assert.ok(path.resolve(f.root).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-merge-test-'));await fs.rm(f.root,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
 const site=path.join(f.root,'site'),translationDirectory=path.join(f.privateRoot,'translations'),submissionDirectory=path.join(f.privateRoot,'submissions'),accountDirectory=path.join(f.privateRoot,'accounts'),historyDirectory=path.join(f.privateRoot,'history'),likesFile=path.join(f.privateRoot,'likes.json');
 for(const dir of [path.join(site,'src/data'),path.join(site,'public'),path.join(site,'dist'),translationDirectory,submissionDirectory,f.options.directory,path.join(f.privateRoot,'drafts')])await fs.mkdir(dir,{recursive:true});
 await fs.copyFile(path.join(projectRoot,'site/package.json'),path.join(site,'package.json'));
 await fs.symlink(await fs.realpath(path.join(projectRoot,'site/node_modules')),path.join(site,'node_modules'),process.platform==='win32'?'junction':'dir');
 const sharp=createRequire(path.join(projectRoot,'site/package.json'))('sharp');
 for(const record of f.records){const id=record.core.item_id,bytes=await sharp({create:{width:40,height:60,channels:3,background:'#eae1cd'}}).png().toBuffer();await fs.writeFile(path.join(f.imageRoot,id,'front-public.png'),bytes);await fs.mkdir(path.join(site,'public/archive',id),{recursive:true});await fs.writeFile(path.join(site,'public/archive',id,'front-public.png'),bytes);}
 await fs.writeFile(path.join(site,'src/data/archive.ts'),archiveSourceForRecords(f.records));
 await fs.writeFile(path.join(site,'src/data/archive-merge-aliases.json'),JSON.stringify({schema_version:1,aliases:{}}));
 await fs.writeFile(path.join(site,'dist/index.html'),'SYNTHETIC PUBLIC BEFORE');await fs.writeFile(likesFile,JSON.stringify({version:1,items:{}}));
 store=createAccountStore({directory:accountDirectory,mailer:{available:false,async send(){}},enableArchiveMerge:true,ipSalt:'synthetic-merge-only'});
 db=new DatabaseSync(store.databaseFile);db.exec('PRAGMA busy_timeout=3000');
 for(const id of ['user-one','user-two'])db.prepare('INSERT INTO users(id,email,nickname,created_at,updated_at) VALUES(?,?,?,?,?)').run(id,id+'@example.invalid','虚构用户','2000-01-01','2000-01-01');
 const readRecords=async()=>Promise.all((await fs.readdir(f.archive)).filter(name=>name.endsWith('.json')).sort().map(async name=>JSON.parse(await fs.readFile(path.join(f.archive,name),'utf8'))));
 const planner=createMergePlanner({...f.options,readRecords,readState:async id=>{let official;try{official=JSON.parse(await fs.readFile(path.join(f.archive,id+'.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}return{official,draft:null,revision:recordRevision(official,null)};},inspectReferences:createMergeReferenceInspector({accountDirectory,submissionDirectory,mergeDirectory:f.directory,translationDirectory,siteDataDirectory:path.join(site,'src/data'),likesFile})});
 const engineOptions={directory:f.directory,archiveDirectory:f.archive,draftDirectory:path.join(f.privateRoot,'drafts'),inboxDirectory:f.imageRoot,siteDirectory:site,sharedDirectory:path.join(projectRoot,'shared'),historyDirectory,translationDirectory,submissionDirectory,likesFile,planner,readRecords,accounts:store.archiveMerge,
  validateImage:createMergeImageValidator(site),
  buildCandidate:async({siteDirectory:candidate})=>{await fs.mkdir(path.join(candidate,'dist'),{recursive:true});await fs.copyFile(path.join(candidate,'src/data/archive.ts'),path.join(candidate,'dist/index.html'));return'synthetic isolated builder';},...options};
 const engine=createArchiveMergeExecution(engineOptions);
 const prepare=async()=>{const pf=await planner.preflight(f.ids,actor);assert.equal(pf.canCompare,true,JSON.stringify(pf.blockers));const payload=f.payload(pf);payload.fieldChoices['core.title']={choice:'custom',value:'虚构同一封信的前后两页'};const op={operationId:crypto.randomUUID(),stepId:crypto.randomUUID(),markChanged(){}};const plan=await planner.save(payload,actor,op);const review=await engine.review({planId:plan.planId,planRevision:plan.planRevision},actor);return{plan,review,payload:{planId:plan.planId,planRevision:plan.planRevision,reviewId:review.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}}};};
 const state=async()=>({archive:await treeDigest(f.archive),inbox:await treeDigest(f.imageRoot),sources:await treeDigest(path.join(site,'src')),public:await treeDigest(path.join(site,'public')),dist:await treeDigest(path.join(site,'dist')),translations:await treeDigest(translationDirectory),favorites:store.archiveMerge.inspect(f.ids).digest});
 return{...f,site,engine,engineOptions,planner,store,db,translationDirectory,historyDirectory,likesFile,readRecords,prepare,state};
}

// 只恢复已知合成夹具的私密日志；不生成新资料、不模拟第二次执行。
export function openExecutionRecovery(root){
 assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-merge-test-'));
 const privateRoot=path.join(root,'private'),site=path.join(root,'site'),archiveDirectory=path.join(root,'archive-data');
 const store=createAccountStore({directory:path.join(privateRoot,'accounts'),mailer:{available:false,async send(){}},ipSalt:'synthetic-merge-only'});
 const engine=createArchiveMergeExecution({directory:path.join(privateRoot,'merges'),archiveDirectory,draftDirectory:path.join(privateRoot,'drafts'),inboxDirectory:path.join(privateRoot,'inbox'),siteDirectory:site,sharedDirectory:path.join(projectRoot,'shared'),historyDirectory:path.join(privateRoot,'history'),translationDirectory:path.join(privateRoot,'translations'),submissionDirectory:path.join(privateRoot,'submissions'),likesFile:path.join(privateRoot,'likes.json'),accounts:store.archiveMerge});
 const state=async(ids)=>({archive:await treeDigest(archiveDirectory),inbox:await treeDigest(path.join(privateRoot,'inbox')),sources:await treeDigest(path.join(site,'src')),public:await treeDigest(path.join(site,'public')),dist:await treeDigest(path.join(site,'dist')),translations:await treeDigest(path.join(privateRoot,'translations')),favorites:store.archiveMerge.inspect(ids).digest});
 return{store,engine,state};
}
