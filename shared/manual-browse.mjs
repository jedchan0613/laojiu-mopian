// 访客浏览目录：只消费已审核的公开投影，不读取维护草稿或原档案。
import {manualCategories,searchManualCatalog} from './manual-catalog.mjs';

const publicKey=(value,kind)=>typeof value==='string'&&value.length<=80&&new RegExp(`^(?:demo-)?${kind}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(value);
export function manualBrandPath(key){
  if(!publicKey(key,'brand'))throw new Error('品牌目录标识无效。');
  return `/manuals/brands/${key}/`;
}
export function manualCategoryPath(key){
  if(!Object.hasOwn(manualCategories,key))throw new Error('说明书品类无效。');
  return `/manuals/categories/${key}/`;
}
export function manualModelAnchor(key,unavailable=false){
  if(!publicKey(key,'model'))throw new Error('型号目录标识无效。');
  return `${unavailable?'unavailable-':''}${key}`;
}

function summary(found){
  return {
    modelCount:found.modelCount,
    documentCount:found.documentCount,
    unavailableModelCount:new Set(found.unavailable.map(group=>group.model.model_key)).size,
    unavailableDocumentCount:new Set(found.unavailable.flatMap(group=>group.documents.map(doc=>doc.manual_key))).size,
  };
}

export function buildManualBrowse(catalog){
  const brands=[];
  for(const brand of catalog.brands){
    const found=searchManualCatalog(catalog,{brand:brand.brand_key});
    if(!found.groups.length&&!found.unavailable.length)continue;
    const usedCategories=new Set([...found.groups,...found.unavailable].map(group=>group.model.category_key));
    brands.push({...brand,path:manualBrandPath(brand.brand_key),...summary(found),found,
      categories:Object.entries(manualCategories).filter(([key])=>usedCategories.has(key)).map(([key,name])=>({key,name})),
    });
  }
  brands.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')||a.brand_key.localeCompare(b.brand_key));
  const categories=[];
  for(const [category_key,name] of Object.entries(manualCategories)){
    const found=searchManualCatalog(catalog,{category:category_key});
    if(!found.groups.length&&!found.unavailable.length)continue;
    const usedBrands=new Set([...found.groups,...found.unavailable].map(group=>group.brand.brand_key));
    categories.push({category_key,name,path:manualCategoryPath(category_key),...summary(found),found,
      brands:brands.filter(brand=>usedBrands.has(brand.brand_key)).map(({brand_key,name})=>({key:brand_key,name})),
    });
  }
  return {brands,categories,...summary(searchManualCatalog(catalog,{}))};
}
