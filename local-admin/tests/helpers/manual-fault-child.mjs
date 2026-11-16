import fs from 'node:fs/promises';
import path from 'node:path';
import {createWriteCoordinator} from '../../write-coordinator.mjs';
import {openFaultFixture} from './manual-fault-fixture.mjs';
const [directory,target]=process.argv.slice(2),config=JSON.parse(await fs.readFile(path.join(directory,'fixture.json')));
const f=await openFaultFixture(config,{checkpoint:async name=>{if(name===target){process.send?.({checkpoint:name});await new Promise(()=>{});}}});
const writes=await createWriteCoordinator({directory:path.join(directory,'private','operations')});
await writes.perform({...config.context,kind:'manual-transfer',target:config.id,payload:{body:config.payload,actor:config.context.actor}},context=>f.review.transfer(config.id,config.payload,f.adapters,{...context,...config.context}),result=>({manualTransfer:result.manualTransferResult}));
process.send?.({checkpoint:'succeeded'});
