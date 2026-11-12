// 接收中不因时钟或过期而释放；预留尚未开流且过期时，实际残留仍计量。
// 已完整落盘的提交中结果也占实际文件空间，无需再加一份预留。
import fs from "node:fs/promises";
import path from "node:path";
import { privateSubmissionImagePattern } from "../shared/manual-pages.mjs";
import { manualPdfUploadIdPattern, manualPdfUploadLimits } from "../shared/manual-pdf-upload.mjs";
import {manualPdfJobPattern,manualPdfJobStates} from '../shared/manual-pdf-generation.mjs';
const fail = () => {
  throw Object.assign(new Error("私密暂存文件无法核对，已暂停新增文件。"), { name: "SubmissionError", statusCode: 503 });
};
const entries = async (dir) => fs.readdir(dir, { withFileTypes: true }).catch((e) => {
  if (e.code === "ENOENT") return [];
  fail();
});
async function submissionPayloadUsage(directory, { now = Date.now() } = {}) {
  let imageBytes = 0, pdfBytes = 0, temporaryBytes = 0, reservedBytes = 0, sourceCount = 0, imageCount = 0;
  const parts = new Map();
  const subtreeBytes = new Map();
  async function visit(dir, inPdf = false, depth = 0) {
    const before=imageBytes+pdfBytes+temporaryBytes;
    if (depth > 12) fail();
    for (const e of await entries(dir)) {
      if (e.isSymbolicLink()) fail();
      const file = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (inPdf || e.name === "pdf") await visit(file, true, depth + 1);
        continue;
      }
      if (!e.isFile()) continue;
      let stat;
      try {
        stat = await fs.lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink()) fail();
      } catch (error) {
        if (error.code === "ENOENT") continue;
        fail();
      }
      if (!Number.isSafeInteger(stat.size) || stat.size < 0) fail();
      if (!inPdf) {
        if (privateSubmissionImagePattern.test(e.name)){imageBytes += stat.size;imageCount++;}
        continue;
      }
      if (/\.json(?:\.[a-f0-9-]+\.tmp)?$/.test(e.name)) continue;
      if (e.name.endsWith(".part")) {
        temporaryBytes += stat.size;
        parts.set(file, stat.size);
      } else if(/\.jpe?g$/i.test(e.name)){
        imageBytes+=stat.size;imageCount++;
      } else {
        pdfBytes += stat.size;
        if (e.name.endsWith(".pdf")&&dir===path.join(directory,'pdf')) sourceCount++;
      }
    }
    subtreeBytes.set(dir,imageBytes+pdfBytes+temporaryBytes-before);
  }
  await visit(directory);
  const uploads = path.join(directory, "pdf", "uploads");
  for (const e of await entries(uploads)) {
    if (!e.isFile() || !e.name.endsWith(".json") || !manualPdfUploadIdPattern.test(e.name.slice(0, -5))) continue;
    let op;
    try {
      op = JSON.parse(await fs.readFile(path.join(uploads, e.name), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      fail();
    }
    if (!op || !["reserved", "receiving", "cancelling", "committing", "saved", "failed", "cancelled", "interrupted", "expired", "needs_review"].includes(op.status) || op.upload_id !== e.name.slice(0, -5) || !Number.isSafeInteger(op.bytes) || op.bytes < 5 || op.bytes > manualPdfUploadLimits.sourceBytes || !Number.isFinite(Date.parse(op.expires_at))) fail();
    if (["reserved", "receiving", "cancelling", "committing"].includes(op.status)) {
      if (op.status === "reserved" && Date.parse(op.expires_at) <= now) continue;
      const part = parts.get(path.join(uploads, op.upload_id + ".part")) ?? 0;
      let committedBytes = 0;
      if (op.target_source?.filename && /^source-[a-f0-9]{64}\.pdf$/.test(op.target_source.filename)) {
        try {
          const stat = await fs.lstat(path.join(directory, "pdf", op.target_source.filename));
          if (!stat.isFile() || stat.isSymbolicLink()) fail();
          committedBytes = stat.size;
        } catch (error) {
          if (error.code !== "ENOENT") fail();
        }
      }
      reservedBytes += Math.max(0, op.bytes - part - committedBytes);
    }
  }
  const jobs=path.join(directory,'pdf','jobs');
  for(const entry of await entries(jobs)){
    if(!entry.isDirectory()||!manualPdfJobPattern.test(entry.name))continue;
    const folder=path.join(jobs,entry.name);let job;
    try{job=JSON.parse(await fs.readFile(path.join(folder,'job.json'),'utf8'));}catch(e){if(e.code==='ENOENT'){if((subtreeBytes.get(folder)??0)>0)fail();continue;}fail();}
    if(job.schema!==1||job.job_id!==entry.name||!manualPdfJobStates.has(job.state)||!Number.isSafeInteger(job.budget_bytes)||job.budget_bytes<0||job.budget_bytes>200*1024*1024)fail();
    reservedBytes+=Math.max(0,job.budget_bytes-(subtreeBytes.get(folder)??0));
  }
  const actualBytes = imageBytes + pdfBytes + temporaryBytes;
  return { imageBytes, imageCount, pdfBytes, temporaryBytes, reservedBytes, actualBytes, allocatedBytes: actualBytes + reservedBytes, sourceCount };
}
async function submissionStorageUsage(root, records, options = {}) {
  const result = { imageBytes: 0, imageCount:0, pdfBytes: 0, temporaryBytes: 0, reservedBytes: 0, actualBytes: 0, allocatedBytes: 0, sourceCount: 0 };
  for (const record of records) {
    if (!/^TG-[A-F0-9]{24}$/.test(record.id ?? "")) fail();
    const dirs = [path.join(root, record.id)];
    for (const e of await entries(path.join(root, ".recycle", record.id))) {
      if (e.isSymbolicLink()) fail();
      if (e.isDirectory()) dirs.push(path.join(root, ".recycle", record.id, e.name));
    }
    for (const dir of dirs) {
      const used = await submissionPayloadUsage(dir, options);
      for (const key of Object.keys(result)) result[key] += used[key];
    }
  }
  return result;
}
export {
  submissionPayloadUsage,
  submissionStorageUsage
};
