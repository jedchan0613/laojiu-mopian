import type {APIRoute} from 'astro';
import {manualsSearchJson,manualsSearchVersion} from '../../data/manuals-catalog';
export function getStaticPaths(){return [{params:{version:manualsSearchVersion}}];}
export const GET:APIRoute=()=>new Response(manualsSearchJson,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate'}});
