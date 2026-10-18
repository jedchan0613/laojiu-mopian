import type {APIRoute} from 'astro';
import {archiveSearchVersion,archiveSearchJson} from '../../data/archive-search-index';
export function getStaticPaths(){return [{params:{version:archiveSearchVersion}}];}
export const GET:APIRoute=()=>new Response(archiveSearchJson,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate'}});
