/* Register the licensed real-food library with the shared local asset manifest. */
(() => {
  const assets=window.LS_ASSET_MANIFEST;
  if(!assets||!window.LS_FOOD_VISUALS)return;
  const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const register=(item,key)=>{
    assets.images[key]={width:item.width,height:item.height,original:item.original||item.src,sizes:item.sizes||{1280:item.src},alt:item.alt||item.name,source:item.source,sha256:item.sha256,credit:item.credit,matchEvidence:item.matchEvidence||'Photographic food reference; not machine performance evidence.'};
    item.assetKey=key;
    return key;
  };
  for(const [name,group] of Object.entries(window.LS_FOOD_VISUALS)){
    const key='food-real-'+slug(name);
    assets.sections.foods[slug(name)]=register(group,key);
    group.items.forEach((item,index)=>register(item,key+'-'+index));
  }
  for(const [name,items] of Object.entries(window.LS_MACHINE_FOOD_OUTPUTS||{}))items.forEach((item,index)=>{
    const existing=Object.values(window.LS_FOOD_VISUALS).flatMap(group=>group.items).find(other=>other.src===item.src);
    item.assetKey=existing?.assetKey||register(item,'machine-food-'+slug(name)+'-'+index);
  });
  // Production-stage pictures show authentic LS work, without identifying a business size.
  assets.sections.segments['micro-startup-businesses']=assets.sections.customerExperiences['photo-3'];
  assets.sections.segments['smes-expanding-manufacturers']=assets.sections.customerExperiences['photo-2'];
  assets.sections.segments['large-mega-enterprises']=assets.sections.currentProduction;
})();
