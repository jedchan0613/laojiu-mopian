import {createLocalManualPdfRuntime} from './manual-pdf-runtime.mjs';
import {createLinuxManualPdfRuntime} from './manual-pdf-linux-runtime.mjs';
export function createManualPdfPlatformRuntime(options={}){
 return process.platform==='linux'?createLinuxManualPdfRuntime(options):createLocalManualPdfRuntime(options);
}
