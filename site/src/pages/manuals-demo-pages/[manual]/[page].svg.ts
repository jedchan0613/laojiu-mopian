import type {APIRoute} from 'astro';
import {manualsCatalog,manualsDemo,demoManualPageSvg} from '../../../data/manuals-catalog';
export function getStaticPaths(){return manualsDemo?manualsCatalog.documents.flatMap(d=>d.pages.map((_,i)=>({params:{manual:d.manual_key,page:String(i+1)}}))):[];}
export const GET:APIRoute=({params})=>new Response(demoManualPageSvg(params.manual!,Number(params.page)),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
