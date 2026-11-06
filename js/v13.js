/* JAPAN ZIP V13 — 장소 찾기(추천+전체 가게 통합) + 여행 도구 + PWA.
   유료 API·API 키 없음. 데이터: data/osm/*.json (GitHub Actions가 매월 생성) */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const fmt=n=>Number(n||0).toLocaleString('ko-KR');
const gmaps=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const REGIONS=typeof JAPAN_REGIONS!=='undefined'?JAPAN_REGIONS:{};
const PREF_JP=typeof JAPAN_PREF_JP!=='undefined'?JAPAN_PREF_JP:{};
const SLUG={"홋카이도":"hokkaido","아오모리":"aomori","이와테":"iwate","미야기":"miyagi","아키타":"akita","야마가타":"yamagata","후쿠시마":"fukushima","이바라키":"ibaraki","도치기":"tochigi","군마":"gunma","사이타마":"saitama","지바":"chiba","도쿄":"tokyo","가나가와":"kanagawa","니가타":"niigata","도야마":"toyama","이시카와":"ishikawa","후쿠이":"fukui","야마나시":"yamanashi","나가노":"nagano","기후":"gifu","시즈오카":"shizuoka","아이치":"aichi","미에":"mie","시가":"shiga","교토":"kyoto","오사카":"osaka","효고":"hyogo","나라":"nara","와카야마":"wakayama","돗토리":"tottori","시마네":"shimane","오카야마":"okayama","히로시마":"hiroshima","야마구치":"yamaguchi","도쿠시마":"tokushima","가가와":"kagawa","에히메":"ehime","고치":"kochi","후쿠오카":"fukuoka","사가":"saga","나가사키":"nagasaki","구마모토":"kumamoto","오이타":"oita","미야자키":"miyazaki","가고시마":"kagoshima","오키나와":"okinawa"};
const toast=(msg)=>{let t=$('v12Toast');if(!t){t=document.createElement('div');t.id='v12Toast';t.className='v12-toast';t.setAttribute('role','status');document.body.append(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2200)};

/* ------------------------------------------------------------------ */
/* 1. 전국 음식점 DB                                                    */
/* ------------------------------------------------------------------ */
const KIND={r:'🍽️ 식당',i:'🏮 이자카야',f:'🍔 패스트푸드·덮밥',c:'☕ 카페',b:'🍸 바',p:'🍺 펍·호프',k:'🥐 빵·과자',s:'🛒 마트',v:'🏪 편의점',o:'♨️ 온천·목욕탕',m:'🖼️ 박물관·미술관',h:'🏯 성',a:'⛩️ 관광명소'};
const KIND_COLOR={r:'#c0563b',i:'#b07a2a',f:'#d18b2c',c:'#7a5a3a',b:'#6b4c9a',p:'#8a5b2c',k:'#c28a54',s:'#2f7d6d',v:'#4c7fb5',o:'#d0607a',m:'#5a6f8f',h:'#3c4b5a',a:'#2d6659'};
const GROUPS=[['food','🍴 음식점 전체 (식당·카페·술집·빵)',['r','i','f','c','b','p','k']],['meal','🍽️ 식사 (식당·이자카야·패스트푸드)',['r','i','f']],['cafe','☕ 카페·디저트·빵',['c','k']],['drink','🍶 술집 (이자카야·바·펍)',['i','b','p']],['mart','🛒 마트·편의점',['s','v']],['spot','⛩️ 관광·온천·박물관·성',['o','m','h','a']],['all','📋 전부',Object.keys(KIND)]];
const CUISINE={japanese:'일식',ramen:'라멘',sushi:'초밥',noodle:'면 요리',soba:'소바',udon:'우동',chinese:'중식',italian:'이탈리안',yakiniku:'야키니쿠',curry:'카레',burger:'햄버거',korean:'한식',indian:'인도 요리',coffee_shop:'커피',pizza:'피자',french:'프렌치',western:'양식',yoshoku:'양식',tempura:'튀김',tonkatsu:'돈카츠',yakitori:'야키토리',okonomiyaki:'오코노미야키',takoyaki:'타코야키',kaiseki:'가이세키',seafood:'해산물',fish:'생선 요리',beef_bowl:'규동',donburi:'덮밥',teishoku:'정식',regional:'향토 요리',chicken:'치킨',fried_chicken:'가라아게·치킨',steak_house:'스테이크',steak:'스테이크',sandwich:'샌드위치',donut:'도넛',ice_cream:'아이스크림',cake:'케이크',crepe:'크레페',bubble_tea:'버블티',tea:'차',american:'아메리칸',thai:'태국 요리',vietnamese:'베트남 요리',mexican:'멕시칸',spanish:'스페인 요리',asian:'아시안',international:'다국적',barbecue:'바비큐',kebab:'케밥',unagi:'장어',eel:'장어',gyoza:'교자',dumpling:'만두',hot_pot:'나베',shabu_shabu:'샤부샤부',sukiyaki:'스키야키',oden:'오덴',izakaya:'이자카야',bar:'바',pasta:'파스타',hamburger:'햄버그',hamburg:'햄버그',omurice:'오므라이스',bento:'도시락',onigiri:'오니기리',bakery:'베이커리',dessert:'디저트',sweets:'디저트',wagashi:'화과자',japanese_sweets:'화과자',confectionery:'과자',kushikatsu:'쿠시카츠',kushiage:'쿠시아게',monjayaki:'몬자야키',jingisukan:'징기스칸',soup_curry:'수프카레',champon:'짬뽕',taiwanese:'대만 요리',german:'독일 요리',breakfast:'아침식사',buffet:'뷔페',vegetarian:'채식',vegan:'비건',local:'지역 요리',fine_dining:'파인다이닝',kebap:'케밥',savory_pancakes:'오코노미야키',friture:'튀김',chicken_wings:'닭날개',fish_and_chips:'피시앤칩스',juice:'주스',wine:'와인',sake:'사케',beer:'맥주',coffee:'커피'};
const cuisineKo=c=>CUISINE[c]||c.replace(/_/g,' ');
const OSM_TYPE={n:'node',w:'way',r:'relation'};
const FAV_KEY='jz-osm-faves-v12';
let favs=store.get(FAV_KEY,{});if(typeof favs!=='object'||Array.isArray(favs))favs={};

/* opening_hours (OSM) — 흔한 형식만 해석. 모르는 형식은 null(판단 불가) */
const DN=['Mo','Tu','We','Th','Fr','Sa','Su'];
function parseHours(str){
  if(!str)return null;str=str.trim();
  if(str==='24/7')return Array.from({length:7},()=>[[0,1440]]);
  const week=Array.from({length:7},()=>null);let any=false;
  for(let rule of str.split(/\s*;\s*/)){
    rule=rule.trim();if(!rule)continue;
    if(/^PH\b/.test(rule))continue;
    rule=rule.replace(/,\s*PH\b/g,'').replace(/\bPH\s*,/g,'');
    const m=rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)?\s*(.*)$/);
    if(!m)return null;
    let days=[];
    if(m[1]){for(const part of m[1].split(/\s*,\s*/)){const [a,b]=part.split('-');const ia=DN.indexOf(a),ib=b?DN.indexOf(b):ia;for(let d=ia;;d=(d+1)%7){days.push(d);if(d===ib)break}}}
    else days=[0,1,2,3,4,5,6];
    const rest=m[2].trim();
    if(/^(off|closed)$/i.test(rest)){days.forEach(d=>week[d]=[]);any=true;continue}
    if(rest==='24/7'||rest==='00:00-24:00'){days.forEach(d=>week[d]=[[0,1440]]);any=true;continue}
    const ranges=[];
    for(const t of rest.split(/\s*,\s*/)){
      const r=t.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\+?$/);if(!r)return null;
      let s=+r[1]*60+ +r[2],e=+r[3]*60+ +r[4];if(e<=s)e+=1440;ranges.push([s,e]);
    }
    days.forEach(d=>week[d]=ranges);any=true;
  }
  return any?week:null;
}
function openNow(str){
  const w=parseHours(str);if(!w)return null;
  const j=new Date(Date.now()+9*3600e3);const d=(j.getUTCDay()+6)%7,min=j.getUTCHours()*60+j.getUTCMinutes();
  const today=w[d],yest=w[(d+6)%7];
  if(today===null&&yest===null)return null;
  if(today&&today.some(([s,e])=>min>=s&&min<e))return true;
  if(yest&&yest.some(([s,e])=>e>1440&&min<e-1440))return true;
  return today===null?null:false;
}
const hoursKo=h=>String(h||'').replace(/\bMo\b/g,'월').replace(/\bTu\b/g,'화').replace(/\bWe\b/g,'수').replace(/\bTh\b/g,'목').replace(/\bFr\b/g,'금').replace(/\bSa\b/g,'토').replace(/\bSu\b/g,'일').replace(/\bPH\b/g,'공휴일').replace(/\boff\b/g,'휴무').replace(/24\/7/,'24시간');
function distKm(a,b,c,d){const R=6371,t=Math.PI/180,x=(c-a)*t,y=(d-b)*t,h=Math.sin(x/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}

/* ------------------------------------------------------------------ */
/* 1. 장소 찾기 (추천 도감 + 전체 가게 통합)                               */
/* ------------------------------------------------------------------ */
const CATS=[
 ['all','전체',['r','i','f','c','b','p','k','s','o','m','h','a'],null],
 ['meal','🍜 식사',['r','i','f'],['일식','중식','양식']],
 ['cafe','☕ 카페·디저트',['c','k'],['카페·디저트']],
 ['drink','🍶 술집',['i','b','p'],['술집']],
 ['mart','🛒 마트·편의점',['s','v'],['마트·쇼핑']],
 ['spot','⛩️ 관광·온천',['o','m','h','a'],['볼거리·체험']]
];
const CUR_FAV_KEY='japan-atlas-faves';
const F={index:null,indexErr:'',region:'',pref:'',city:'',ward:'',cat:'all',kind:'',cuisine:'',kw:'',food:'',lt:'',awType:'',shownAw:9,hours:false,open:false,nochain:false,sort:'name',
  fav:false,curArea:'',showAllCities:false,cityFilter:'',filtersOpen:false,doc:null,docs:new Map(),osm:[],cur:[],curNote:'',shownOsm:40,shownCur:6,user:null,map:null,cluster:null,mapOn:false,places:null};
const regionOf=p=>Object.keys(REGIONS).find(r=>REGIONS[r].includes(p))||'';
const curFavs=()=>new Set(store.get(CUR_FAV_KEY,[]));
const norm=x=>String(x||'').toLowerCase().replace(/\s+/g,'');
const stripSuffix=x=>String(x||'').replace(/(시|정|촌|구|군|초|마치|무라|市|町|村|区|郡)$/,'');

function fzShell(){
  const root=$('fz');if(!root)return;
  root.innerHTML=`
  <div class="card fz-top">
    <div class="fz-search"><span aria-hidden="true">🔍</span><input id="fzQ" type="search" autocomplete="off" placeholder="지명·가게·음식 (예: 오타루, 新宿, 라멘)" aria-label="지명·가게·음식 검색" aria-controls="fzSug"><div id="fzSug" class="fz-sug" role="listbox" hidden></div></div>
    <div id="fzWhere" class="fz-where" role="navigation" aria-label="선택한 지역"></div>
    <div id="fzPicker" class="fz-picker"></div>
    <div class="fz-cats"><div class="fz-chips" id="fzCats" role="group" aria-label="종류"></div><button class="btn" id="fzFilterBtn" type="button" aria-expanded="false">⚙️ 필터</button></div>
    <div class="fz-row" id="fzFoodRow"><div class="fz-label">🍽️ 뭐 먹을까? <small>(가게 종류 기준 · 추정)</small></div><div class="fz-chips fz-food" id="fzFood" role="group" aria-label="음식 분류"></div></div>
    <div class="fz-row" id="fzLTRow"><div class="fz-chips" id="fzLT" role="group" aria-label="로컬·관광객"></div></div>
    <div id="fzActive" class="fz-active"></div>
    <div id="fzFilters" class="fz-filters" hidden>
      <div class="control"><label for="fzCuisine">요리 장르</label><select id="fzCuisine"></select></div>
      <div class="control"><label for="fzKind">세부 종류</label><select id="fzKind"></select></div>
      <div class="control"><label for="fzSort">정렬</label><select id="fzSort"><option value="name">이름순</option><option value="dist">내 위치에서 가까운 순</option><option value="city">시정촌순</option></select></div>
      <div class="fz-checks"><label><input type="checkbox" id="fzHours"> 🕒 영업시간 정보 있는 곳만</label><label><input type="checkbox" id="fzOpen"> 🟢 지금 영업 중 (일본시간·추정)</label><label><input type="checkbox" id="fzNoChain"> 🏮 체인점 빼고 로컬 가게만</label></div>
      <button class="btn" id="fzFilterReset" type="button">필터 초기화</button>
    </div>
    <div class="fz-actions"><button class="btn dark" id="fzNear" type="button">📍 내 위치 근처</button><button class="btn" id="fzMapBtn" type="button">🗺️ 지도</button><button class="btn" id="fzFavBtn" type="button">★ 저장한 곳</button><a class="btn" id="fzG" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps">구글 지도에서 더 찾기 ↗</a></div>
    <div id="fzStatus" class="tiny" role="status"></div>
  </div>
  <div id="fzMapWrap" class="v12-map-wrap" hidden><div id="fzMap" class="v12-map"></div><p class="tiny">지도 © OpenStreetMap contributors · 지도에는 📋 전체 가게만 표시돼요 (추천 장소는 좌표 정보가 없음).</p></div>
  <section class="fz-block" id="fzAwBlock"><div class="fz-block-head"><h2 id="fzAwTitle">🏆 현지 평가 · 🏮 노포 추천</h2><p class="tiny" id="fzAwSub">🏆 타베로그 百名店(일본 현지인 평점 상위 가게를 장르별로 선정)·미쉐린 빕구르망, 🏮 지자체가 표창한 100년 이상 노포(교토부 「京の老舗」 등) 같은 공개 목록 기준이에요. 리뷰 원문이 아니라 선정 사실만 표시해요.</p></div><div class="fz-chips" id="fzAwType" role="group" aria-label="추천 종류"></div><div class="v12-list" id="fzAw"></div><div class="fz-more"><button class="btn dark" id="fzAwMore" type="button" hidden>더 보기</button></div></section>
  <details class="fz-block fz-curwrap" id="fzCurBlock"><summary><span id="fzCurTitle">⭐ JAPAN ZIP 기존 추천</span> <small class="tiny">열기/닫기</small></summary><p class="tiny" id="fzCurSub">직접 고른 장소 · 메뉴·가격·설명 포함 · 카드를 누르면 상세 정보</p><div class="v12-list" id="fzCur"></div><div class="fz-more"><button class="btn" id="fzCurMore" type="button" hidden>추천 더 보기</button></div></details>
  <section class="fz-block" id="fzOsmBlock"><div class="fz-block-head"><h2 id="fzOsmTitle">📋 전체 가게</h2><p class="tiny">OpenStreetMap 공개 지도 데이터 · 이름·종류·영업시간·위치</p></div><div class="v12-list" id="fzOsm"></div><div class="fz-more"><button class="btn dark" id="fzOsmMore" type="button" hidden>더 보기</button></div>
   <div class="section-note">📋 데이터 출처: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> (ODbL). 누구나 편집하는 공개 지도라서 폐업·이전·영업시간 변경이 늦게 반영될 수 있고, 일부 시골은 등록된 가게가 적어요. 방문 전 구글 지도에서 확인하세요.</div></section>`;
  $('fzCats').innerHTML=CATS.map(c=>`<button type="button" class="pill" data-cat="${c[0]}">${c[1]}</button>`).join('');
  const q=$('fzQ');let qt;
  q.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(suggest,120)});
  q.addEventListener('focus',suggest);
  q.addEventListener('keydown',e=>{const items=[...$('fzSug').querySelectorAll('[data-sug]')];if(!items.length)return;let i=items.findIndex(x=>x.classList.contains('on'));
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();i=e.key==='ArrowDown'?(i+1)%items.length:(i-1+items.length)%items.length;items.forEach((x,k)=>x.classList.toggle('on',k===i));items[i].scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'){e.preventDefault();pickSug(+(items[i<0?0:i].dataset.sug))}else if(e.key==='Escape'){hideSug()}});
  document.addEventListener('click',e=>{if(!e.target.closest('.fz-search'))hideSug()});
  $('fzSug').addEventListener('click',e=>{const b=e.target.closest('[data-sug]');if(b)pickSug(+b.dataset.sug)});
  $('fzWhere').addEventListener('click',e=>{const b=e.target.closest('[data-crumb]');if(!b)return;const lv=b.dataset.crumb;
    F.curArea='';
    if(lv==='jp'){F.region='';F.pref='';F.city='';F.ward='';F.doc=null}else if(lv==='region'){F.pref='';F.city='';F.ward='';F.doc=null}else if(lv==='pref'){F.city='';F.ward=''}else if(lv==='city'){F.ward=''}
    F.fav=false;F.showAllCities=false;refresh()});
  $('fzPicker').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b)return;const [t,v]=[b.dataset.pick,b.dataset.v];F.fav=false;
    if(t==='region'){F.region=v;refresh()}else if(t==='pref'){choosePref(v)}else if(t==='city'){F.city=v;F.ward='';F.curArea='';refresh()}else if(t==='ward'){F.ward=v;refresh()}else if(t==='allcities'){F.showAllCities=!F.showAllCities;renderPicker()}});
  $('fzPicker').addEventListener('input',e=>{if(e.target.id==='fzCityFilter'){F.cityFilter=e.target.value;renderPicker();const i=$('fzCityFilter');i.focus();i.setSelectionRange(i.value.length,i.value.length)}});
  $('fzCats').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;F.cat=b.dataset.cat;F.kind='';F.fav=false;if(F.cat==='spot'||F.cat==='mart'){F.food='';F.lt=''}refresh()});
  $('fzFood').addEventListener('click',e=>{const b=e.target.closest('[data-food]');if(!b)return;F.food=F.food===b.dataset.food?'':b.dataset.food;F.fav=false;refresh()});
  $('fzLT').addEventListener('click',e=>{const b=e.target.closest('[data-lt]');if(!b)return;F.lt=b.dataset.lt;F.fav=false;refresh()});
  $('fzAwMore').addEventListener('click',()=>{F.shownAw+=12;renderAw()});
  $('fzAwType').addEventListener('click',e=>{const b=e.target.closest('[data-awt]');if(!b)return;F.awType=b.dataset.awt;F.shownAw=9;renderAw();renderStatus()});
  $('fzAw').addEventListener('click',onAwClick);
  $('fzFilterBtn').addEventListener('click',()=>{F.filtersOpen=!F.filtersOpen;$('fzFilters').hidden=!F.filtersOpen;$('fzFilterBtn').setAttribute('aria-expanded',String(F.filtersOpen))});
  $('fzCuisine').addEventListener('change',e=>{F.cuisine=e.target.value;refresh()});
  $('fzKind').addEventListener('change',e=>{F.kind=e.target.value;refresh()});
  $('fzSort').addEventListener('change',e=>{F.sort=e.target.value;if(F.sort==='dist'&&!F.user)locate(false);else refresh()});
  [['fzHours','hours'],['fzOpen','open'],['fzNoChain','nochain']].forEach(([id,k])=>$(id).addEventListener('change',e=>{F[k]=e.target.checked;refresh()}));
  $('fzFilterReset').addEventListener('click',()=>{Object.assign(F,{cuisine:'',kind:'',hours:false,open:false,nochain:false,sort:'name',kw:''});refresh()});
  $('fzActive').addEventListener('click',e=>{const b=e.target.closest('[data-clear]');if(!b)return;const k=b.dataset.clear;if(k==='kw')F.kw='';else if(k==='cuisine')F.cuisine='';else if(k==='kind')F.kind='';else F[k]=false;refresh()});
  $('fzNear').addEventListener('click',()=>locate(true));
  $('fzMapBtn').addEventListener('click',toggleMap);
  $('fzFavBtn').addEventListener('click',()=>{F.fav=!F.fav;refresh()});
  $('fzCurMore').addEventListener('click',()=>{F.shownCur+=12;renderCur()});
  $('fzOsmMore').addEventListener('click',()=>{F.shownOsm+=40;renderOsm()});
  $('fzCur').addEventListener('click',onCurClick);
  $('fzOsm').addEventListener('click',onOsmClick);
}

/* ---------- 자동완성 ---------- */
function buildPlaces(){
  const out=[];const seen=new Set();
  const push=o=>{const k=o.type+'|'+o.pref+'|'+(o.city||o.name);if(seen.has(k))return;seen.add(k);out.push(o)};
  for(const r of Object.keys(REGIONS))push({type:'region',region:r,pref:'',name:r,keys:[norm(r)]});
  for(const p of Object.values(REGIONS).flat()){const jp=PREF_JP[p]||'';push({type:'pref',pref:p,name:p,jp,keys:[norm(p),norm(jp),norm(jp.replace(/[都府県]$/,''))]})}
  const P=F.index?.prefs||{};
  for(const v of Object.values(P))for(const c of (v.cityList||[]))push({type:'city',pref:v.ko,city:c[0],ko:c[1],n:c[2],name:c[0],keys:[norm(c[0]),norm(c[1]),norm(stripSuffix(c[1])),norm(stripSuffix(c[0]))]});
  const towns=window.JZIP_TOWNS||{};
  for(const [p,list] of Object.entries(towns))for(const t of list)push({type:'town',pref:p,name:t,keys:[norm(t)]});
  if(typeof DATA!=='undefined')for(const d of DATA)if(d.area&&d.pref)push({type:'town',pref:d.pref,name:d.area,keys:[norm(d.area)]});
  // 같은 현에 같은 이름의 시정촌(또는 현 자체)이 있으면 동네 항목은 중복이므로 숨김
  const cityKeys=new Set(out.filter(o=>o.type==='city'||o.type==='pref').map(o=>o.pref+'|'+norm(stripSuffix(o.type==='city'?(o.ko||o.city):o.pref))));
  F.places=out.filter(o=>o.type!=='town'||!cityKeys.has(o.pref+'|'+norm(stripSuffix(o.name))));
}
function cuisineMatches(q){const n=norm(q);if(!n)return [];const res=[];const seen=new Set();for(const [k,v] of Object.entries(CUISINE)){if(seen.has(v))continue;if(norm(v).startsWith(n)||k.startsWith(n)){seen.add(v);res.push([k,v])}}return res.slice(0,2)}
let SUG=[];
function suggest(){
  const q=$('fzQ').value.trim();const box=$('fzSug');
  if(!q){hideSug();return}
  if(!F.places)buildPlaces();
  const n0=norm(q),n=(n0.length>2?n0.replace(/(도|부|현|都|府|県)$/,''):n0)||n0;const score=o=>{let b=99;for(const k of o.keys){if(!k)continue;if(k===n)b=Math.min(b,0);else if(k.startsWith(n))b=Math.min(b,1);else if(k.includes(n))b=Math.min(b,3)}return b+({region:0,pref:0,city:.5,town:.7}[o.type]??1)};
  const hits=F.places.map(o=>[o,score(o)]).filter(x=>x[1]<50).sort((a,b)=>a[1]-b[1]||(b[0].n||0)-(a[0].n||0)).slice(0,8).map(x=>x[0]);
  SUG=[];
  for(const h of hits)SUG.push({kind:'place',o:h});
  for(const [k,v] of cuisineMatches(q))SUG.push({kind:'cuisine',k,v});
  SUG.push({kind:'kw',q});
  const where=F.pref?(F.pref+(F.city!==''&&F.doc?' '+(F.doc.cities[+F.city]?.[0]||''):'')):'전국 추천';
  box.innerHTML=SUG.map((s,i)=>{
    if(s.kind==='kw')return `<button type="button" class="fz-sug-item fz-sug-kw" data-sug="${i}" role="option">🍴 가게·메뉴 이름으로 “${esc(s.q)}” 검색 <small>${esc(where)}에서</small></button>`;
    if(s.kind==='cuisine')return `<button type="button" class="fz-sug-item" data-sug="${i}" role="option">🍜 장르: <b>${esc(s.v)}</b> <small>${F.pref?esc(F.pref)+' 전체 가게에서':'지역을 고르면 전체 가게에 적용'}</small></button>`;
    const o=s.o;const icon={region:'🗾',pref:'🏯',city:'📍',town:'🏘️'}[o.type];
    const label=o.type==='city'?`${esc(o.city)}${o.ko?' ('+esc(o.ko)+')':''}`:o.type==='pref'?`${esc(o.pref)} (${esc(o.jp)})`:esc(o.name);
    const sub=o.type==='region'?'광역 지역':o.type==='pref'?esc(regionOf(o.pref)):o.type==='city'?esc(o.pref)+' · 가게 '+fmt(o.n)+'곳':esc(o.pref);
    return `<button type="button" class="fz-sug-item" data-sug="${i}" role="option">${icon} ${label} <small>${sub}</small></button>`;
  }).join('');
  box.hidden=false;
}
function hideSug(){const b=$('fzSug');if(b)b.hidden=true}
async function pickSug(i){
  const s=SUG[i];if(!s)return;hideSug();$('fzQ').value='';F.fav=false;
  if(s.kind==='kw'){F.kw=s.q.toLowerCase();refresh();return}
  if(s.kind==='cuisine'){F.cuisine=s.k;if(F.cat!=='all'&&F.cat!=='meal'&&F.cat!=='cafe'&&F.cat!=='drink')F.cat='all';refresh();return}
  const o=s.o;
  if(o.type==='region'){F.region=o.region;F.pref='';F.city='';F.ward='';F.doc=null;refresh();return}
  await choosePref(o.pref,true);
  if(o.type==='city'&&F.doc){const ci=F.doc.cities.findIndex(c=>c[0]===o.city);if(ci>=0)F.city=String(ci)}
  else if(o.type==='town'){if(F.doc){const t=stripSuffix(o.name);const ci=F.doc.cities.findIndex(c=>c[1]&&stripSuffix(c[1])===t);if(ci>=0)F.city=String(ci)}if(F.city==='')F.curArea=o.name}
  refresh();
  if(o.type==='town'&&F.city===''&&F.doc)toast('“'+o.name+'”은(는) '+o.pref+' 안의 동네예요. ⭐ 추천은 이 동네 기준, 📋 전체 가게는 아래 시정촌 버튼으로 좁혀 보세요.');
}

/* ---------- 데이터 로딩 ---------- */
async function loadIndex(){
  try{const r=await fetch('data/osm/index.json',{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);F.index=await r.json();}
  catch(e){F.indexErr=location.protocol==='file:'?'file':'missing'}
  if(F.index){const h=$('v12HomeOsmCount');if(h){h.hidden=false;h.textContent='📋 전국 가게 '+fmt(F.index.total)+'곳'}}
  F.places=null;
}
async function choosePref(ko,silent){
  F.pref=ko;F.region=regionOf(ko);F.city='';F.ward='';F.curArea='';F.showAllCities=false;F.cityFilter='';F.doc=null;
  if(!silent)refresh();
  if(!F.index){if(!silent)refresh();return}
  const slug=SLUG[ko];
  try{let doc=F.docs.get(slug);if(!doc){$('fzStatus').textContent=ko+' 가게 데이터를 불러오는 중…';const r=await fetch('data/osm/'+slug+'.json');if(!r.ok)throw new Error('HTTP '+r.status);doc=await r.json();F.docs.set(slug,doc)}
    if(F.pref===ko)F.doc=doc;}
  catch(e){$('fzStatus').textContent='⚠️ '+ko+' 가게 데이터를 불러오지 못했어요 ('+e.message+')'}
  if(!silent)refresh();
}

/* ---------- 화면 갱신 ---------- */
function refresh(){F.shownCur=6;F.shownOsm=40;F.shownAw=9;if(F.doc&&AW)matchAwards(F.doc);renderWhere();renderPicker();renderCats();renderFilters();renderFoodLT();compute();renderAw();renderCur();renderOsm();renderStatus();updateG();if(F.mapOn)drawMap()}
const WARD_KO={"中央区":"주오구","北区":"기타구","東区":"히가시구","西区":"니시구","南区":"미나미구","中区":"나카구","緑区":"미도리구","港区":"미나토구","旭区":"아사히구","泉区":"이즈미구","鶴見区":"쓰루미구","青葉区":"아오바구","白石区":"시로이시구","豊平区":"도요히라구","厚別区":"아쓰베쓰구","手稲区":"데이네구","清田区":"기요타구","宮城野区":"미야기노구","若林区":"와카바야시구","太白区":"다이하쿠구","大宮区":"오미야구","見沼区":"미누마구","桜区":"사쿠라구","浦和区":"우라와구","岩槻区":"이와쓰키구","花見川区":"하나미가와구","稲毛区":"이나게구","若葉区":"와카바구","美浜区":"미하마구","神奈川区":"가나가와구","港南区":"고난구","保土ケ谷区":"호도가야구","磯子区":"이소고구","金沢区":"가나자와구","港北区":"고호쿠구","都筑区":"쓰즈키구","戸塚区":"도쓰카구","栄区":"사카에구","瀬谷区":"세야구","川崎区":"가와사키구","幸区":"사이와이구","中原区":"나카하라구","高津区":"다카쓰구","多摩区":"다마구","宮前区":"미야마에구","麻生区":"아사오구","江南区":"고난구","秋葉区":"아키하구","西蒲区":"니시칸구","葵区":"아오이구","駿河区":"스루가구","清水区":"시미즈구","浜名区":"하마나구","天竜区":"덴류구","千種区":"지쿠사구","中村区":"나카무라구","昭和区":"쇼와구","瑞穂区":"미즈호구","熱田区":"아쓰타구","中川区":"나카가와구","守山区":"모리야마구","名東区":"메이토구","天白区":"덴파쿠구","上京区":"가미교구","左京区":"사쿄구","中京区":"나카교구","東山区":"히가시야마구","山科区":"야마시나구","下京区":"시모교구","右京区":"우쿄구","西京区":"니시쿄구","伏見区":"후시미구","都島区":"미야코지마구","福島区":"후쿠시마구","此花区":"고노하나구","大正区":"다이쇼구","天王寺区":"덴노지구","浪速区":"나니와구","西淀川区":"니시요도가와구","東淀川区":"히가시요도가와구","東成区":"히가시나리구","生野区":"이쿠노구","城東区":"조토구","阿倍野区":"아베노구","住吉区":"스미요시구","東住吉区":"히가시스미요시구","西成区":"니시나리구","淀川区":"요도가와구","住之江区":"스미노에구","平野区":"히라노구","堺区":"사카이구","美原区":"미하라구","東灘区":"히가시나다구","灘区":"나다구","兵庫区":"효고구","長田区":"나가타구","須磨区":"스마구","垂水区":"다루미구","安佐南区":"아사미나미구","安佐北区":"아사키타구","安芸区":"아키구","佐伯区":"사에키구","門司区":"모지구","若松区":"와카마쓰구","戸畑区":"도바타구","小倉北区":"고쿠라키타구","小倉南区":"고쿠라미나미구","八幡東区":"야하타히가시구","八幡西区":"야하타니시구","博多区":"하카타구","城南区":"조난구","早良区":"사와라구"};
const wardKo=w=>(F.doc?.wards?.[w])||WARD_KO[w]||'';
const wardLabel=w=>w?(w+(wardKo(w)?' ('+wardKo(w)+')':'')):'';
function cityLabel(ci){const c=F.doc?.cities?.[+ci];return c?c[0]+(c[1]?' ('+c[1]+')':''):''}
function renderWhere(){
  const parts=[`<button type="button" data-crumb="jp" class="${!F.region?'on':''}">📍 일본 전국</button>`];
  if(F.region)parts.push(`<button type="button" data-crumb="region" class="${!F.pref?'on':''}">${esc(F.region)}</button>`);
  if(F.pref)parts.push(`<button type="button" data-crumb="pref" class="${F.city===''?'on':''}">${esc(F.pref)}</button>`);
  if(F.city!=='')parts.push(`<button type="button" data-crumb="city" class="${!F.ward?'on':''}">${esc(F.city==='-1'?'시정촌 미확인':cityLabel(F.city))}</button>`);
  if(F.ward)parts.push(`<button type="button" class="on">${esc(wardLabel(F.ward))}</button>`);
  $('fzWhere').innerHTML=parts.join('<span aria-hidden="true">›</span>')+(F.fav?'<span class="fz-favtag">★ 저장한 곳 보는 중</span>':'');
}
function renderPicker(){
  const el=$('fzPicker');const P=F.index?.prefs||{};
  const curCount=p=>(typeof DATA!=='undefined'?DATA.filter(d=>d.pref===p).length:0);
  if(F.fav){el.innerHTML='';return}
  if(!F.region){el.innerHTML=`<div class="fz-label">어느 지역으로 가세요?</div><div class="fz-chips">${Object.keys(REGIONS).map(r=>`<button type="button" class="pill" data-pick="region" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div>`;return}
  if(!F.pref){el.innerHTML=`<div class="fz-label">${esc(F.region)}의 도도부현</div><div class="fz-chips">${REGIONS[F.region].map(p=>{const n=P[SLUG[p]]?.count;return `<button type="button" class="pill" data-pick="pref" data-v="${esc(p)}">${esc(p)} <small>${esc(PREF_JP[p]||'')}${n?' · '+fmt(n):''}</small></button>`}).join('')}</div>`;return}
  if(!F.doc){el.innerHTML=F.index?'<div class="tiny">시정촌 목록 불러오는 중…</div>':`<div class="tiny">⭐ 추천 장소는 ${esc(F.pref)} 전체 기준으로 보여줘요. ${F.indexErr==='file'?'':'(📋 전체 가게 데이터 준비 전)'}</div>`;return}
  const doc=F.doc;
  if(F.city!==''&&F.city!=='-1'){
    const ci=+F.city;const cnt={};doc.rows.forEach(r=>{if(r[7]===ci&&r[8])cnt[r[8]]=(cnt[r[8]]||0)+1});const ws=Object.keys(cnt).sort((a,b)=>a.localeCompare(b,'ja'));
    el.innerHTML=ws.length>1?`<div class="fz-label">${esc(cityLabel(ci))}의 구</div><div class="fz-chips">${ws.map(w=>`<button type="button" class="pill ${F.ward===w?'on':''}" data-pick="ward" data-v="${esc(w)}">${esc(w)}${wardKo(w)?` <small>${esc(wardKo(w))}</small>`:''} <small>${fmt(cnt[w])}</small></button>`).join('')}</div>`:'';
    return;
  }
  if(F.city==='-1'){el.innerHTML='';return}
  const cs=doc.cities.map((c,i)=>({i,jp:c[0],ko:c[1],n:c[2]}));
  const top=[...cs].sort((a,b)=>b.n-a.n).slice(0,12);
  const fq=norm(F.cityFilter);
  const all=[...cs].sort((a,b)=>a.jp.localeCompare(b.jp,'ja')).filter(c=>!fq||norm(c.jp).includes(fq)||norm(c.ko).includes(fq));
  const chip=c=>`<button type="button" class="pill" data-pick="city" data-v="${c.i}">${esc(c.jp)}${c.ko?` <small>${esc(c.ko)}</small>`:''} <small>${fmt(c.n)}</small></button>`;
  const none=doc.rows.filter(r=>r[7]<0).length;
  el.innerHTML=`<div class="fz-label">${esc(F.pref)}의 시·구·정·촌 <small>(가게 많은 순 12곳)</small></div><div class="fz-chips">${top.map(chip).join('')}<button type="button" class="pill fz-allbtn" data-pick="allcities">${F.showAllCities?'접기 ▴':'전체 '+cs.length+'개 보기 ▾'}</button></div>`+
   (F.showAllCities?`<div class="fz-allcities"><input id="fzCityFilter" type="search" placeholder="시정촌 이름으로 좁히기 (예: 町, 니세코)" value="${esc(F.cityFilter)}"><div class="fz-chips">${all.map(chip).join('')}${none&&!fq?`<button type="button" class="pill" data-pick="city" data-v="-1">시정촌 미확인 <small>${fmt(none)}</small></button>`:''}</div></div>`:'');
}
function renderCats(){$('fzCats').querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('on',b.dataset.cat===F.cat));$('fzFavBtn').classList.toggle('on',F.fav);$('fzMapBtn').classList.toggle('on',F.mapOn)}
function catDef(){return CATS.find(c=>c[0]===F.cat)||CATS[0]}
function renderFilters(){
  const ks=catDef()[2];$('fzKind').innerHTML='<option value="">세부 전체</option>'+ks.map(k=>`<option value="${k}">${KIND[k]}</option>`).join('');$('fzKind').value=F.kind;
  const cnt={};osmBase().forEach(r=>{if(r[4])r[4].split(';').forEach(c=>{c=c.trim().toLowerCase();if(c)cnt[c]=(cnt[c]||0)+1})});
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,80);
  if(F.cuisine&&!cnt[F.cuisine]&&F.doc)top.unshift([F.cuisine,0]);
  $('fzCuisine').innerHTML='<option value="">장르 전체</option>'+top.map(([c,n])=>`<option value="${esc(c)}">${esc(cuisineKo(c))}${n?' · '+fmt(n):''}</option>`).join('')+(F.cuisine&&!F.doc?`<option value="${esc(F.cuisine)}">${esc(cuisineKo(F.cuisine))}</option>`:'');
  $('fzCuisine').value=F.cuisine;$('fzSort').value=F.sort;$('fzHours').checked=F.hours;$('fzOpen').checked=F.open;$('fzNoChain').checked=F.nochain;
  const act=[];
  if(F.kw)act.push(['kw','🔎 “'+F.kw+'”']);if(F.cuisine)act.push(['cuisine','🍜 '+cuisineKo(F.cuisine)]);if(F.kind)act.push(['kind',KIND[F.kind]]);
  if(F.hours)act.push(['hours','🕒 영업시간 있음']);if(F.open)act.push(['open','🟢 지금 영업 중']);if(F.nochain)act.push(['nochain','🏮 체인 제외']);
  $('fzActive').innerHTML=act.map(([k,l])=>`<button type="button" class="fz-tag" data-clear="${k}">${esc(l)} ✕</button>`).join('');
  const n=act.length;$('fzFilterBtn').textContent='⚙️ 필터'+(n?' ('+n+')':'');
}
function osmBase(){
  if(!F.doc)return [];
  const ks=F.kind?[F.kind]:catDef()[2];const ci=F.city===''?null:+F.city;
  return F.doc.rows.filter(r=>ks.includes(r[3])&&(ci===null||r[7]===ci)&&(!F.ward||r[8]===F.ward));
}
function compute(){
  // 📋 OSM
  let rows=osmBase();
  if(F.cuisine)rows=rows.filter(r=>r[4]&&r[4].toLowerCase().split(';').map(x=>x.trim()).includes(F.cuisine));
  if(F.kw){const q=F.kw;rows=rows.filter(r=>(r[1]+' '+r[2]+' '+r[4]+' '+(window.jzGuess?.(r)?.label||'')+' '+(r[4]||'').split(';').map(c=>cuisineKo(c.trim().toLowerCase())).join(' ')).toLowerCase().includes(q))}
  if(F.hours)rows=rows.filter(r=>r[9]);if(F.open)rows=rows.filter(r=>openNow(r[9])===true);if(F.nochain)rows=rows.filter(r=>!r[11]);
  if(F.food&&window.jzFoodCats)rows=rows.filter(r=>window.jzFoodCats(r).has(F.food));
  if(F.lt)rows=rows.filter(r=>ltOf(r,F.doc)===F.lt);
  if(F.user)rows.forEach(r=>r._d=distKm(F.user.lat,F.user.lon,r[5],r[6]));
  if(F.sort==='dist'&&F.user)rows=[...rows].sort((a,b)=>a._d-b._d);else if(F.sort==='city')rows=[...rows].sort((a,b)=>a[7]-b[7]||a[1].localeCompare(b[1],'ja'));else rows=[...rows].sort((a,b)=>a[1].localeCompare(b[1],'ja'));
  F.osm=rows;
  // ⭐ curated
  if(typeof DATA==='undefined'){F.cur=[];return}
  const genres=catDef()[3];const cuisineKw=F.cuisine?cuisineKo(F.cuisine):'';
  let cur=DATA.filter(p=>(!F.region||(REGIONS[F.region]||[]).includes(p.pref))&&(!F.pref||p.pref===F.pref)&&(!genres||genres.includes(p.genre)));
  if(F.cat==='mart'&&!genres)cur=cur.filter(p=>p.genre==='마트·쇼핑');
  const text=p=>(p.name+' '+p.jp+' '+p.area+' '+p.sub+' '+p.genre+' '+p.menu+' '+p.desc).toLowerCase();
  if(F.kw)cur=cur.filter(p=>text(p).includes(F.kw));
  if(cuisineKw)cur=cur.filter(p=>text(p).includes(cuisineKw.toLowerCase()));
  if(F.food&&window.jzFoodCatsText)cur=cur.filter(p=>window.jzFoodCatsText(p.name+' '+p.jp+' '+p.sub+' '+p.menu+' '+p.genre).has(F.food));
  F.curNote='';
  const area=F.curArea||(F.city!==''&&F.city!=='-1'&&F.doc?(F.doc.cities[+F.city]||[]):null);
  if(area){
    const keys=Array.isArray(area)?[stripSuffix(area[1]),stripSuffix(area[0]),F.ward].filter(x=>x&&x.length>=2):[area];
    const inArea=cur.filter(p=>keys.some(k=>(p.area+' '+p.name+' '+p.jp).includes(k)));
    if(inArea.length)cur=inArea;else F.curNote=`이 동네만의 추천이 없어서 ${F.pref} 전체 추천을 보여줘요.`;
  }
  const order={official:2,reported:1,estimate:0};
  cur.sort((a,b)=>(order[b.priceCheck]-order[a.priceCheck])||(Number(!!b.source)-Number(!!a.source))||a.name.localeCompare(b.name,'ko'));
  F.cur=cur;
}
function curCard(p,favSet){
  const sym={'일식':'🍜','중식':'🥟','양식':'🍛','술집':'🍢','카페·디저트':'☕','마트·쇼핑':'🛒','볼거리·체험':'⛩️'}[p.genre]||'🍽️';
  const fav=favSet.has(p.id);
  return `<article class="v12-card fz-cur" data-cid="${esc(p.id)}" tabindex="0" title="누르면 상세 정보">
   <div class="v12-card-top"><span class="tag fz-star">⭐ 추천</span><span class="tag">${sym} ${esc(p.genre)} · ${esc(p.sub)}</span>${p.priceCheck!=='estimate'?'<span class="tag fz-verified">✓ 가격 확인</span>':''}</div>
   <h3>${esc(p.name)}</h3><div class="japan">${esc(p.jp)} · ${esc(p.pref)} / ${esc(p.area)}</div>
   <p class="fz-desc">${esc(p.desc)}</p>
   <div class="fz-menu">🍽️ ${esc(p.menu)} <span>${esc(p.price)}</span></div>
   <div class="v12-actions"><button class="btn dark" type="button" data-c="detail">상세 보기</button><a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(p.map)}">구글 지도 ↗</a><button class="btn" type="button" data-c="trip">＋ 일정</button><button class="btn v12-fav ${fav?'on':''}" type="button" data-c="fav" aria-label="저장">${fav?'★':'☆'}</button></div></article>`;
}
function renderCur(){
  const favSet=curFavs();
  let list=F.cur;let title='⭐ JAPAN ZIP 추천';
  if(F.fav){list=(typeof DATA!=='undefined'?DATA:[]).filter(p=>favSet.has(p.id));title='⭐ 저장한 추천 장소'}
  else title+=F.pref?` · ${F.pref}`:F.region?` · ${F.region}`:' · 전국';
  $('fzCurTitle').textContent=title+' ('+fmt(list.length)+')';
  if(F.fav)$('fzCurBlock').open=true;
  $('fzCurSub').textContent=F.curNote||'직접 고른 장소 · 메뉴·가격·설명 포함 · 카드를 누르면 상세 정보';
  $('fzCur').innerHTML=list.length?list.slice(0,F.shownCur).map(p=>curCard(p,favSet)).join(''):`<div class="placeholder"><b>${F.fav?'저장한 추천 장소가 없어요.':'이 조건의 추천 장소가 없어요.'}</b><p>${F.fav?'추천 카드의 ☆를 누르면 여기에 모여요.':'아래 📋 전체 가게에서 찾아보세요.'}</p></div>`;
  $('fzCurMore').hidden=list.length<=F.shownCur;$('fzCurMore').textContent='추천 더 보기 ('+fmt(Math.min(F.shownCur,list.length))+' / '+fmt(list.length)+')';
}
// 일본어 가게 이름 아래 한글 읽기 (작은 글씨)
function koLine(ko,name){return ko&&ko!==name?`<div class="fz-ko" title="한글 읽기 (자동 변환이라 실제 발음과 조금 다를 수 있어요)">🇰🇷 ${esc(ko)}</div>`:''}
window.jzKoLine=koLine;
function osmCard(r,doc,slug,cityOverride){
  const city=cityOverride??(doc?.cities?.[r[7]]?(doc.cities[r[7]][0]+(r[8]?' '+r[8]:'')):''),cityKo=cityOverride!=null?'':[doc?.cities?.[r[7]]?.[1]||'',r[8]?((doc?.wards?.[r[8]])||WARD_KO[r[8]]||''):''].filter(Boolean).join(' ');
  const on=openNow(r[9]);const key=slug+'|'+r[0];const fav=!!favs[key];
  const cs=(r[4]||'').split(';').filter(Boolean).map(c=>cuisineKo(c.trim().toLowerCase()));
  const badge=on===true?'<span class="v12-open">🟢 지금 영업 중(추정)</span>':on===false?'<span class="v12-closed">⚪ 지금은 영업시간 아님</span>':'';
  const dist=(F.user&&r._d!=null)?`<span class="v12-dist">📏 ${r._d<1?Math.round(r._d*1000)+'m':r._d.toFixed(1)+'km'}</span>`:'';
  const t=OSM_TYPE[r[0][0]]||'node',id=r[0].slice(1);
  return `<article class="v12-card" data-key="${esc(key)}">
   <div class="v12-card-top"><span class="tag" style="background:${KIND_COLOR[r[3]]}1a;color:${KIND_COLOR[r[3]]}">${KIND[r[3]]||''}</span>${cs.slice(0,3).map(c=>`<span class="tag">${esc(c)}</span>`).join('')}${r[11]?'<span class="tag v12-chain">체인</span>':''}${ltBadge(r,doc)}${awBadge(r,doc)}${dist}</div>
   <h3>${esc(r[1])}</h3>${koLine(r[15],r[1])}${r[2]&&r[2]!==r[15]?`<div class="japan">${esc(r[2])}</div>`:''}
   <div class="tiny">📍 ${esc(doc?.pref||'')} ${esc(city)}${cityKo?' ('+esc(cityKo)+')':''}</div>${window.jzMenuLine?window.jzMenuLine(r,city||doc?.jp||''):''}
   ${r[9]?`<div class="v12-hours">🕒 ${esc(hoursKo(r[9]))} ${badge}</div>`:'<div class="v12-hours tiny">🕒 영업시간 정보 없음 — 지도에서 확인</div>'}
   <div class="v12-actions">
    <a class="btn dark" target="_blank" rel="noopener noreferrer" href="${gmaps(r[1]+' '+(city||doc?.jp||''))}">구글 지도 ↗</a>
    <a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${r[5]},${r[6]}">길찾기</a>
    ${r[10]?`<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(r[10])}">홈페이지</a>`:''}
    <button class="btn" type="button" data-v12="trip">＋ 일정</button>
    <button class="btn v12-fav ${fav?'on':''}" type="button" data-v12="fav" aria-label="저장">${fav?'★':'☆'}</button>
    <a class="v12-osm" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/${t}/${id}">OSM에서 수정</a>
   </div></article>`;
}
function renderOsm(){
  const el=$('fzOsm');let title='📋 전체 가게';
  if(F.fav){
    const items=Object.entries(favs).sort((a,b)=>(b[1].at||0)-(a[1].at||0));
    $('fzOsmTitle').textContent='📋 저장한 가게 ('+fmt(items.length)+')';
    el.innerHTML=items.length?items.slice(0,F.shownOsm).map(([key,v])=>{const row=[v.id,v.name,v.alt||'',v.kind,v.cuisine||'',v.lat,v.lon,-1,'',v.hours||'',v.web||'',0];if(F.user)row._d=distKm(F.user.lat,F.user.lon,v.lat,v.lon);return osmCard(row,{pref:v.pref,cities:[],jp:''},v.slug,v.city||'')}).join(''):'<div class="placeholder"><b>저장한 가게가 없어요.</b><p>📋 가게 카드의 ☆를 누르면 여기에 모여요.</p></div>';
    $('fzOsmMore').hidden=items.length<=F.shownOsm;return;
  }
  if(!F.pref){
    $('fzOsmTitle').textContent=title;
    el.innerHTML=`<div class="placeholder"><b>${F.index?'지역(도도부현)을 고르면 그 지역의 전체 가게가 나와요.':F.indexErr==='file'?'파일을 더블클릭해서 열면(file://) 전체 가게 데이터를 읽을 수 없어요.':'📋 전체 가게 데이터가 아직 준비되지 않았어요.'}</b><p>${F.index?'위 검색창에 지명을 치거나 지역 버튼을 누르세요. 📍 내 위치 근처를 누르면 지금 있는 현을 자동으로 열어요.':F.indexErr==='file'?'GitHub Pages 주소로 열어 주세요.':'저장소 Actions에서 “Build OSM restaurant DB”를 실행하면 채워져요.'}</p></div>`;
    $('fzOsmMore').hidden=true;return;
  }
  if(!F.doc){$('fzOsmTitle').textContent=title;el.innerHTML=F.index?'<div class="placeholder">불러오는 중…</div>':'<div class="placeholder"><b>📋 전체 가게 데이터 준비 전이에요.</b><p>위의 ⭐ 추천 장소와 “구글 지도에서 더 찾기”를 이용하세요.</p></div>';$('fzOsmMore').hidden=true;return}
  const rows=F.osm;
  $('fzOsmTitle').textContent=`${title} · ${F.pref}${F.city!==''?' '+(F.city==='-1'?'시정촌 미확인':F.doc.cities[+F.city]?.[0]||''):''}${F.ward?' '+wardLabel(F.ward):''} (${fmt(rows.length)})`;
  el.innerHTML=rows.length?rows.slice(0,F.shownOsm).map(r=>osmCard(r,F.doc,SLUG[F.pref])).join(''):'<div class="placeholder"><b>조건에 맞는 가게가 없어요.</b><p>필터를 풀거나 종류를 “전체”로 바꿔 보세요. 등록이 적은 시골은 “구글 지도에서 더 찾기”를 이용하세요.</p></div>';
  $('fzOsmMore').hidden=rows.length<=F.shownOsm;$('fzOsmMore').textContent='더 보기 ('+fmt(Math.min(F.shownOsm,rows.length))+' / '+fmt(rows.length)+')';
}
/* ---------- 🍽️ 음식 분류 · 🏠 로컬/🧳 관광객 ---------- */
const LT_CELL=0.004;
function ltOf(r,doc){
  if(r._lt!==undefined)return r._lt;
  if(!doc||!doc.rows||'omhasv'.includes(r[3])){r._lt='';return ''}
  if(!doc._lt){const g=new Map();for(const x of doc.rows){if(!'omha'.includes(x[3]))continue;const k=Math.floor(x[5]/LT_CELL)+'|'+Math.floor(x[6]/LT_CELL);g.set(k,(g.get(k)||0)+1)}doc._lt=g}
  const a=Math.floor(r[5]/LT_CELL),b=Math.floor(r[6]/LT_CELL);let n=0;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)n+=doc._lt.get((a+i)+'|'+(b+j))||0;
  let s=0;if(r[2])s+=2;if(n>=6)s+=2;else if(n>=2)s+=1;
  r._lt=(s>=3||n>=12)?'tourist':(s===0&&!r[11])?'local':'';return r._lt;
}
function ltBadge(r,doc){const t=ltOf(r,doc);return t==='local'?'<span class="tag fz-local">🏠 로컬(추정)</span>':t==='tourist'?'<span class="tag fz-tourist">🧳 관광객 많음(추정)</span>':''}
function renderFoodLT(){
  const show=!F.fav&&F.cat!=='spot'&&F.cat!=='mart';
  $('fzFoodRow').hidden=!show||!window.JZ_FOODCATS;$('fzLTRow').hidden=!show||!F.doc;
  if(!show)return;
  const base=osmBase();const cnt={};
  if(window.jzFoodCats)for(const r of base)for(const k of window.jzFoodCats(r))cnt[k]=(cnt[k]||0)+1;
  $('fzFood').innerHTML=(window.JZ_FOODCATS||[]).map(([k,l])=>`<button type="button" class="pill ${F.food===k?'on':''}" data-food="${k}">${l}${F.doc?` <small>${fmt(cnt[k]||0)}</small>`:''}</button>`).join('');
  if(F.doc){let lc=0,tc=0;for(const r of base){const t=ltOf(r,F.doc);if(t==='local')lc++;else if(t==='tourist')tc++}
    $('fzLT').innerHTML=[['','전체'],['local','🏠 로컬 가게 '+fmt(lc)],['tourist','🧳 관광객 많은 곳 '+fmt(tc)]].map(([k,l])=>`<button type="button" class="pill ${F.lt===k?'on':''}" data-lt="${k}">${l}</button>`).join('')+'<span class="tiny fz-lt-note">외국어 이름 등록·주변 관광지 수·체인 여부로 추정</span>';}
}
/* ---------- 🏆 현지 평가 (공개 수상·선정 목록) ---------- */
const PREF_BY_JP=Object.fromEntries(Object.entries(PREF_JP).map(([k,v])=>[v,k]));
const normName=x=>String(x||'').toLowerCase().normalize('NFKC').replace(/[\s・･·\-‐－()（）「」『』!！?？.,、。'’"&＆]/g,'');
let AW=null,awP=null;
function loadAwards(){
  if(AW)return Promise.resolve(AW);if(awP)return awP;
  awP=fetch('data/awards.json').then(r=>r.ok?r.json():null).then(d=>{if(!d)return null;
    AW={byPref:{},updated:d.updated};
    for(const s of d.shops){const ko=PREF_BY_JP[s[1]];if(!ko)continue;(AW.byPref[ko]??=[]).push({name:s[0],loc:s[2]||'',src:d.sources[s[3]],cu:s[4]||'',founded:s[5]||'',hy:s[6]||'',ko:s[7]||'',n:normName(s[0])})}
    return AW}).catch(()=>null);
  return awP;
}
function matchAwards(doc){
  if(doc._aw||!AW)return;doc._aw=new Map();
  const list=AW.byPref[doc.pref]||[];const byN=new Map(),byP=new Map();
  for(const r of doc.rows){if('omhasv'.includes(r[3]))continue;const n=normName(r[1]);if(n.length<2)continue;if(!byN.has(n))byN.set(n,[]);byN.get(n).push(r);const p2=n.slice(0,2);if(!byP.has(p2))byP.set(p2,new Set());byP.get(p2).add(n)}
  for(const a of list){
    let c=byN.get(a.n)||[];
    if(!c.length&&a.n.length>=4){for(const k of byP.get(a.n.slice(0,2))||[]){if(k.startsWith(a.n)||(k.length>=4&&a.n.startsWith(k)&&!/店|館/.test(a.n.slice(k.length))))c=c.concat(byN.get(k))}}
    if(c.length>1){const loc=a.loc.replace(/駅$/,'');const f=c.filter(r=>{const ct=doc.cities[r[7]];return ct&&(loc.includes(stripSuffix(ct[0]))||(r[8]&&loc.includes(r[8])))});if(f.length)c=f}
    a.row=c.length&&c.length<=3?c[0]:null;
    if(a.row){if(!doc._aw.has(a.row[0]))doc._aw.set(a.row[0],[]);doc._aw.get(a.row[0]).push(a)}
  }
}
function awBadge(r,doc){const l=doc?._aw?.get(r[0]);if(!l)return '';return '<span class="tag fz-award">🏆 '+esc([...new Set(l.map(a=>a.src[0]==='미쉐린 빕구르망'?'빕구르망':'백명점'+(a.src[1]?'·'+a.src[1]:'')))].join(' / '))+'</span>'}
const AW_CAT={'라멘':['noodle'],'초밥':['sea'],'야키니쿠':['beef'],'돈카츠':['pork','rice'],'우동':['noodle'],'소바':['noodle'],'카레':['curry'],'이자카야':['drink'],'중화요리':['asian'],'야키토리':['chicken','drink'],'교자':['asian'],'킷사텐':['sweet'],'카페':['sweet'],'빵':['sweet'],'디저트':['sweet'],'화과자·갑미':['sweet']};
const AW_JA={'라멘':'ラーメン','초밥':'寿司','야키니쿠':'焼肉','돈카츠':'とんかつ','우동':'うどん','소바':'そば','카레':'カレー','이자카야':'居酒屋','중화요리':'中華','야키토리':'焼鳥','교자':'餃子','킷사텐':'喫茶','카페':'カフェ','빵':'パン','디저트':'ケーキ','화과자·갑미':'和菓子'};
const AW_PRICE={'라멘':['라멘 전문점','1인 ¥1,000~1,800'],'초밥':['초밥 전문점','점심 ¥3,000~ · 저녁 ¥10,000~30,000 이상 고급점 많음'],'야키니쿠':['야키니쿠','1인 ¥5,000~15,000'],'돈카츠':['돈카츠 전문점','1인 ¥1,800~4,000'],'우동':['우동','1인 ¥500~1,500'],'소바':['소바','1인 ¥1,000~2,500'],'카레':['카레','1인 ¥1,200~2,000'],'이자카야':['이자카야','1인 ¥4,000~8,000'],'중화요리':['중화요리','점심 ¥1,500~ · 코스 ¥8,000~ 고급점 포함'],'야키토리':['야키토리','1인 ¥5,000~12,000'],'교자':['교자 전문점','1인 ¥600~1,500'],'킷사텐':['킷사텐(찻집)','1인 ¥600~1,500'],'카페':['카페','1인 ¥800~2,000'],'빵':['빵집','빵 1개 ¥300~800'],'디저트':['디저트·케이크','1인 ¥600~1,500'],'화과자·갑미':['화과자·갑미','1인 ¥300~1,500']};
const SHINISE_KO=[['京料理','교토 요리'],['懐石','가이세키 요리'],['料亭','료테이(고급 일식)'],['料理旅館','료칸 요리'],['料理屋','일식 요리점'],['有職料理','궁중풍 일식'],['精進','사찰 요리'],['すっぽん','자라 요리'],['すき焼','스키야키'],['いもぼう','이모보(토란·대구 조림)'],['にしんそば','청어 소바'],['鯖寿司','고등어 초밥'],['寿司','초밥'],['そば','소바'],['うどん','우동'],['うなぎ','장어'],['鮎','은어 요리'],['筍','죽순 요리'],['天ぷら','튀김'],['洋食','일본식 양식'],['フランス','프랑스 요리'],['水炊き','미즈타키'],['湯豆腐','유도후'],['おでん','오뎅'],['あんこう','아귀 요리'],['どぜう','미꾸라지 요리'],['鴨','오리 요리'],['豆富','두부 요리'],['八ツ橋','야쓰하시'],['和菓子','화과자'],['菓子','과자'],['甘味','디저트(갑미)'],['茶屋','찻집'],['喫茶','킷사텐'],['パン','빵집'],['茶舗','차 가게(녹차)'],['茶','차 가게(녹차)'],['酒造','사케 양조장'],['焼酎','소주 양조장'],['酒','술'],['豆腐','두부 가게'],['湯葉','유바'],['生麩','나마후'],['漬物','절임(쓰케모노)'],['醤油','간장'],['味噌','된장'],['酢','식초'],['昆布','다시마'],['佃煮','쓰쿠다니(조림)'],['蒲鉾','어묵'],['梅干','우메보시'],['しらす','시라스'],['七味','시치미'],['海苔','김'],['煎餅','센베이'],['団子','당고'],['餅','떡'],['弁当','도시락'],['仕出し','도시락·출장요리'],['精肉','정육점'],['果物','과일'],['フルーツ','과일 디저트'],['蜂蜜','꿀'],['麺','면']];
const shiniseKo=c=>{const f=SHINISE_KO.find(([j])=>String(c||'').includes(j));return f?f[1]:(c||'노포')};
function awLine(a,place){
  if(a.src[5]==='shinise'){const photo='https://www.google.com/search?tbm=isch&q='+encodeURIComponent(a.name+' '+place);
    return `<div class="jz-menu-line fz-shinise-line">🏮 <b>${esc(shiniseKo(a.cu))}</b>${a.cu?` <small>(${esc(a.cu)})</small>`:''} — 100년 넘게 이어온 가게예요.<div class="jz-price-note">가격은 가게마다 달라요. 구글 지도에서 메뉴·가격을 확인하세요.</div><a class="jz-photo" target="_blank" rel="noopener noreferrer" href="${photo}">📷 사진 보기 ↗</a></div>`}
  const p=AW_PRICE[a.src[1]];const mich=a.src[0]==='미쉐린 빕구르망';
  const label=p?p[0]:(a.cu||'음식점');const price=p?p[1]:(mich?'1인 ¥5,000 이하 (빕구르망 선정 기준)':'');
  const photo='https://www.google.com/search?tbm=isch&q='+encodeURIComponent(a.name+' '+place+' メニュー');
  return `<div class="jz-menu-line">🍽️ <b>${esc(label)}</b>${mich&&p?' · 빕구르망은 1인 ¥5,000 이하 기준':''}${price?`<div class="jz-price">💴 대략 ${esc(price)} <small>(이 장르 선정 가게들의 대략적 가격대 · 추정)</small></div>`:''}<a class="jz-photo" target="_blank" rel="noopener noreferrer" href="${photo}">📷 메뉴 사진 보기 ↗</a></div>`;
}
function awCats(a){if(!a._c)a._c=new Set(AW_CAT[a.src[1]]||[...(window.jzFoodCatsText?.(a.cu+' '+a.name)||[])]);return a._c}
const CAT_FOODS={meal:['noodle','sea','beef','pork','chicken','rice','curry','asian','western','teppan'],cafe:['sweet'],drink:['drink','chicken'],mart:[],spot:[]};
function awardsInView(){
  if(!AW||!F.pref)return [];
  let list=AW.byPref[F.pref]||[];
  if(F.city!==''&&F.city!=='-1'&&F.doc){const ci=+F.city,c=F.doc.cities[ci];list=list.filter(a=>a.row?(a.row[7]===ci&&(!F.ward||a.row[8]===F.ward)):(c&&a.loc.includes(stripSuffix(c[0]))))}
  if(F.awType)list=list.filter(a=>(a.src[5]==='shinise')===(F.awType==='shinise'));
  if(F.food)list=list.filter(a=>awCats(a).has(F.food));
  const cm=CAT_FOODS[F.cat];if(cm)list=list.filter(a=>[...awCats(a)].some(k=>cm.includes(k)));
  if(F.kw)list=list.filter(a=>(a.name+' '+a.src[1]+' '+a.cu+' '+a.loc).toLowerCase().includes(F.kw));
  const m=new Map();
  for(const a of list){const g=m.get(a.n)||[];const hit=g.find(x=>!a.loc||!x.loc||a.loc===x.loc);if(hit){hit.all.push(a);if(!hit.loc&&a.loc)hit.loc=a.loc;if(!hit.row&&a.row)hit.row=a.row}else{g.push({...a,all:[a]});m.set(a.n,g)}}
  let out=[...m.values()].flat();
  if(F.user)out.forEach(x=>x._d=x.row?distKm(F.user.lat,F.user.lon,x.row[5],x.row[6]):1e9);
  out.sort((a,b)=>((F.user&&F.sort==='dist')?a._d-b._d:0)||(b.all.length-a.all.length)||(Number(!!b.row)-Number(!!a.row))||a.name.localeCompare(b.name,'ja'));
  return out;
}
function awardCard(a){
  const r=a.row,slug=SLUG[F.pref];const city=r?(F.doc.cities[r[7]]?.[0]||'')+(r[8]?' '+wardLabel(r[8]):''):'';
  const seenB=new Set();const badges=a.all.filter(x=>{const k=x.src[0]+x.src[1]+x.src[2];if(seenB.has(k))return false;seenB.add(k);return true}).map(x=>x.src[5]==='shinise'
    ?`<a class="tag fz-shinise" target="_blank" rel="noopener noreferrer" href="${esc(x.src[3])}">🏮 100년 노포 · ${esc(x.src[0])}${x.hy?' · '+esc(x.hy)+'년 표창':''} ↗</a>`
    :`<a class="tag fz-award" target="_blank" rel="noopener noreferrer" href="${esc(x.src[3])}">🏆 ${esc(x.src[0])} ${esc(x.src[2])}${x.src[1]?' · '+esc(x.src[1]):''}${x.cu?' · '+esc(x.cu):''} ↗</a>`).join('')+(a.all.find(x=>x.founded)?`<span class="tag fz-founded">창업 ${esc(a.all.find(x=>x.founded).founded)}</span>`:'');
  const line=awLine(a.all.find(x=>AW_PRICE[x.src[1]])||a,city||PREF_JP[F.pref]||'');
  const t=r?(OSM_TYPE[r[0][0]]||'node'):'';const fav=r&&favs[slug+'|'+r[0]];
  const dist=(F.user&&r&&a._d<1e8)?`<span class="v12-dist">📏 ${a._d<1?Math.round(a._d*1000)+'m':a._d.toFixed(1)+'km'}</span>`:'';
  return `<article class="v12-card fz-awcard" ${r?`data-key="${esc(slug+'|'+r[0])}"`:''} data-awn="${esc(a.n)}">
   <div class="v12-card-top">${badges}${dist}</div>
   <h3>${esc(a.name)}</h3>${koLine(a.ko||r?.[15],a.name)}
   <div class="tiny">📍 ${esc(F.pref)} ${esc(city||'')}${a.loc&&!city.includes(a.loc)?' · '+esc(a.loc):''} ${r?'<span class="fz-located">✓ 지도 위치 확인</span>':''}</div>
   ${line}
   ${r&&r[9]?`<div class="v12-hours">🕒 ${esc(hoursKo(r[9]))}</div>`:''}
   <div class="v12-actions">
    <a class="btn dark" target="_blank" rel="noopener noreferrer" href="${gmaps(a.name+' '+(PREF_JP[F.pref]||'')+' '+(a.loc||''))}">구글 지도·평점 ↗</a>
    ${r?`<a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${r[5]},${r[6]}">길찾기</a>`:''}
    <button class="btn" type="button" data-aw="trip">＋ 일정</button>
    ${r?`<button class="btn v12-fav ${fav?'on':''}" type="button" data-v12="fav" aria-label="저장">${fav?'★':'☆'}</button>`:''}
   </div></article>`;
}
function renderAw(){
  const blk=$('fzAwBlock');if(!blk)return;
  if(F.fav||F.cat==='spot'||F.cat==='mart'){blk.hidden=true;return}
  blk.hidden=false;$('fzAwType').innerHTML='';
  if(!AW){$('fzAwTitle').textContent='🏆 현지 평가 추천';$('fzAw').innerHTML='<div class="placeholder">현지 평가 목록을 불러오는 중이거나, data/awards.json 파일이 아직 없어요.</div>';$('fzAwMore').hidden=true;return}
  if(!F.pref){$('fzAwTitle').textContent='🏆 현지 평가 추천';$('fzAw').innerHTML='<div class="placeholder"><b>지역(도도부현)을 고르면 그 지역의 현지 평가 추천 가게가 나와요.</b><p>전국 '+fmt(Object.values(AW.byPref).reduce((s,l)=>s+l.length,0))+'곳 (타베로그 백명점 16개 장르 · 미쉐린 빕구르망)</p></div>';$('fzAwMore').hidden=true;return}
  const list=F.aw=awardsInView();
  {const sv=F.awType;F.awType='';const base=awardsInView();F.awType=sv;const nS=base.filter(a=>a.all.some(x=>x.src[5]==='shinise')).length;
   $('fzAwType').innerHTML=[['','전체 '+fmt(base.length)],['award','🏆 수상·선정 '+fmt(base.length-nS)],['shinise','🏮 100년 노포 '+fmt(nS)]].map(([k,l])=>`<button type="button" class="pill ${F.awType===k?'on':''}" data-awt="${k}">${l}</button>`).join('')}
  $('fzAwTitle').textContent=`🏆 현지 평가 · 🏮 노포 · ${F.pref}${F.city!==''&&F.city!=='-1'&&F.doc?' '+(F.doc.cities[+F.city]?.[0]||''):''} (${fmt(list.length)})`;
  $('fzAw').innerHTML=list.length?list.slice(0,F.shownAw).map(awardCard).join(''):'<div class="placeholder"><b>이 조건의 현지 평가 추천 가게가 없어요.</b><p>시정촌을 전체로 바꾸거나 음식 분류를 풀어 보세요. 아래 📋 전체 가게에서 🏠 로컬 가게를 골라 볼 수도 있어요.</p></div>';
  $('fzAwMore').hidden=list.length<=F.shownAw;$('fzAwMore').textContent='더 보기 ('+fmt(Math.min(F.shownAw,list.length))+' / '+fmt(list.length)+')';
}
function onAwClick(e){
  const b=e.target.closest('[data-aw],[data-v12]');if(!b)return;const card=b.closest('.fz-awcard');
  if(b.dataset.v12){onOsmClick(e);return}
  const a=(F.aw||[]).find(x=>x.n===card.dataset.awn);if(!a)return;
  const city=a.row?(F.doc.cities[a.row[7]]?.[0]||''):a.loc;
  if(typeof window.jzAddPlace==='function'){window.jzAddPlace({id:'',name:a.name,pref:F.pref,area:city});toast('✏️ '+a.name+' → 일정 편집기에 추가했어요')}
}
function renderStatus(){
  const st=$('fzStatus');
  if(F.fav){st.textContent='★ 저장한 곳은 이 브라우저에 저장돼요. 다른 기기로 옮기려면 여행 도구 → 백업을 쓰세요.';return}
  const parts=[];
  if(F.index)parts.push(`📋 전국 가게 ${fmt(F.index.total)}곳 · 기준일 ${F.index.built}`);
  if(F.pref&&AW)parts.push(`🏆 현지 평가 ${fmt(F.aw?.length||0)}곳`);
  if(F.doc)parts.push(`📋 ${F.pref} 가게 ${fmt(F.osm.length)}곳`);
  st.textContent=parts.join(' · ');
}
function updateG(){
  const city=F.doc&&F.city!==''&&F.city!=='-1'?F.doc.cities[+F.city]?.[0]:'';
  const what=F.kw||(F.cuisine?(CUISINE_JA[F.cuisine]||F.cuisine):({meal:'レストラン',cafe:'カフェ',drink:'居酒屋',mart:'スーパー',spot:'観光スポット'}[F.cat]||'グルメ'));
  $('fzG').href=gmaps([F.pref?PREF_JP[F.pref]:'日本',city,F.ward,what].filter(Boolean).join(' '));
}
const CUISINE_JA={ramen:'ラーメン',sushi:'寿司',udon:'うどん',soba:'そば',yakiniku:'焼肉',curry:'カレー',japanese:'和食',chinese:'中華',italian:'イタリアン',yakitori:'焼鳥',tonkatsu:'とんかつ',tempura:'天ぷら',okonomiyaki:'お好み焼き',seafood:'海鮮',coffee_shop:'カフェ',burger:'ハンバーガー',korean:'韓国料理',beef_bowl:'牛丼',izakaya:'居酒屋',pizza:'ピザ',french:'フレンチ'};

/* ---------- 카드 버튼 ---------- */
function onCurClick(e){
  const card=e.target.closest('[data-cid]');if(!card)return;const p=DATA.find(x=>x.id===card.dataset.cid);if(!p)return;
  const b=e.target.closest('[data-c]');if(e.target.closest('a'))return;
  const act=b?b.dataset.c:'detail';
  if(act==='detail'){if(typeof window.jzDetail==='function')window.jzDetail(p);else window.open(p.map,'_blank','noopener')}
  else if(act==='trip'){if(typeof window.jzAddPlace==='function'){window.jzAddPlace(p);toast('✏️ '+p.name+' → 일정 편집기에 추가했어요')}}
  else if(act==='fav'){const s=curFavs();if(s.has(p.id))s.delete(p.id);else s.add(p.id);store.set(CUR_FAV_KEY,[...s]);b.classList.toggle('on',s.has(p.id));b.textContent=s.has(p.id)?'★':'☆';toast(s.has(p.id)?'★ 저장했어요':'저장을 취소했어요');
    if(F.fav)renderCur()}
}
$('fz')?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-cid]')){e.preventDefault();onCurClick({target:e.target})}});
function onOsmClick(e){
  const b=e.target.closest('[data-v12]');if(!b)return;const key=b.closest('[data-key]').dataset.key;
  const [slug,id]=key.split('|');const doc=F.docs.get(slug);const row=doc?.rows.find(r=>r[0]===id);const fv=favs[key];
  const name=row?row[1]:fv?.name,pref=row?doc.pref:fv?.pref||'',city=row?(doc.cities[row[7]]?.[0]||'')+(row[8]?' '+row[8]:''):fv?.city||'';
  if(b.dataset.v12==='fav'){
    if(favs[key])delete favs[key];else if(row)favs[key]={name:row[1],alt:row[2],ko:row[15]||'',kind:row[3],cuisine:row[4],lat:row[5],lon:row[6],city,pref,hours:row[9],web:row[10],slug,id:row[0],at:Date.now()};
    store.set(FAV_KEY,favs);b.classList.toggle('on',!!favs[key]);b.textContent=favs[key]?'★':'☆';toast(favs[key]?'★ 저장했어요':'저장을 취소했어요');if(F.fav)renderOsm();
  }else if(b.dataset.v12==='trip'){
    if(typeof window.jzAddPlace!=='function'){toast('일정 편집기를 찾을 수 없어요');return}
    window.jzAddPlace({id:'',name,pref,area:city});toast('✏️ '+name+' → 일정 편집기에 추가했어요');
  }
}

/* ---------- 내 위치 / 지도 ---------- */
function locate(open){
  if(!navigator.geolocation){toast('이 브라우저는 위치 기능을 지원하지 않아요');return}
  toast('📍 위치 확인 중… (권한을 허용해 주세요)');
  navigator.geolocation.getCurrentPosition(async pos=>{
    F.user={lat:pos.coords.latitude,lon:pos.coords.longitude};F.sort='dist';F.fav=false;
    if(open&&F.index){
      let best=null,bd=1e9;
      for(const v of Object.values(F.index.prefs)){if(!v.count)continue;const [a,b,c,d]=v.bbox;const inside=F.user.lat>=a&&F.user.lat<=c&&F.user.lon>=b&&F.user.lon<=d;const dd=distKm(F.user.lat,F.user.lon,(a+c)/2,(b+d)/2)-(inside?1e4:0);if(dd<bd){bd=dd;best=v.ko}}
      if(best&&bd<1500&&best!==F.pref){await choosePref(best);toast('📍 '+best+'을(를) 열고 가까운 순으로 정렬했어요');return}
      if(!best||bd>=1500)toast('일본 밖에 있어서 가까운 순 정렬만 적용했어요');
    }else if(open&&!F.index)toast('📋 전체 가게 데이터가 준비되면 위치 기반 검색이 돼요');
    F.city='';F.ward='';refresh();
  },err=>{toast('위치를 가져오지 못했어요 ('+(err.code===1?'권한 거부':'오류')+')');F.sort='name';refresh()},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}
let leafletP=null;
function loadLeaflet(){
  if(window.L&&window.L.markerClusterGroup)return Promise.resolve();
  if(leafletP)return leafletP;
  const css=h=>{const l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.append(l)};
  const js=h=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=h;s.onload=ok;s.onerror=()=>no(new Error('지도 라이브러리 로드 실패'));document.head.append(s)});
  css('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');css('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');css('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');
  leafletP=js('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(()=>js('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js')).catch(e=>{leafletP=null;throw e});
  return leafletP;
}
async function toggleMap(){
  F.mapOn=!F.mapOn;$('fzMapWrap').hidden=!F.mapOn;$('fzMapBtn').classList.toggle('on',F.mapOn);$('fzMapBtn').textContent=F.mapOn?'🗺️ 지도 닫기':'🗺️ 지도';
  if(!F.mapOn)return;
  try{await loadLeaflet()}catch(e){toast('지도를 불러오지 못했어요 (인터넷 연결 확인)');F.mapOn=false;$('fzMapWrap').hidden=true;$('fzMapBtn').textContent='🗺️ 지도';return}
  if(!F.map){
    F.map=L.map('fzMap',{preferCanvas:true}).setView([36.2,138.25],5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(F.map);
    F.cluster=L.markerClusterGroup({chunkedLoading:true,maxClusterRadius:50,disableClusteringAtZoom:17});F.map.addLayer(F.cluster);
  }
  setTimeout(()=>{F.map.invalidateSize();drawMap()},50);
}
function drawMap(){
  if(!F.map||!F.cluster)return;F.cluster.clearLayers();
  const pts=F.fav?Object.values(favs).map(v=>({lat:v.lat,lon:v.lon,name:v.name,kind:v.kind,sub:v.pref+' '+(v.city||'')}))
    :F.osm.slice(0,30000).map(r=>({lat:r[5],lon:r[6],name:r[1],ko:r[15]||'',kind:r[3],sub:(F.doc?.cities?.[r[7]]?.[0]||F.pref)}));
  const ms=pts.map(p=>L.circleMarker([p.lat,p.lon],{radius:7,weight:2,color:'#fff',fillColor:KIND_COLOR[p.kind]||'#2d6659',fillOpacity:.95}).bindPopup(`<b>${esc(p.name)}</b>${p.ko&&p.ko!==p.name?'<br><small>🇰🇷 '+esc(p.ko)+'</small>':''}<br>${KIND[p.kind]||''} · ${esc(p.sub)}<br><a target="_blank" rel="noopener noreferrer" href="${gmaps(p.name+' '+p.sub)}">구글 지도 ↗</a> · <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}">길찾기</a>`));
  F.cluster.addLayers(ms);
  if(F.user)L.circleMarker([F.user.lat,F.user.lon],{radius:9,color:'#fff',weight:3,fillColor:'#1a73e8',fillOpacity:1}).bindPopup('내 위치').addTo(F.cluster);
  if(ms.length){try{F.map.fitBounds(F.cluster.getBounds(),{padding:[20,20],maxZoom:16})}catch(e){}}
}

/* ------------------------------------------------------------------ */
/* 2. 여행 도구                                                          */
/* ------------------------------------------------------------------ */
const PHRASES={
 '🍽️ 식당':[['한 명이에요','一人です。','히토리데스'],['두 명이에요','二人です。','후타리데스'],['메뉴 주세요','メニューをください。','메뉴-오 쿠다사이'],['한국어 메뉴 있나요?','韓国語のメニューはありますか？','칸코쿠고노 메뉴-와 아리마스카'],['추천 메뉴는 뭐예요?','おすすめは何ですか？','오스스메와 난데스카'],['이걸로 주세요','これをください。','코레오 쿠다사이'],['같은 걸로 주세요','同じものをください。','오나지 모노오 쿠다사이'],['물 주세요','お水をください。','오미즈오 쿠다사이'],['곱빼기로 해 주세요','大盛りでお願いします。','오-모리데 오네가이시마스'],['면은 단단하게 해 주세요','麺はかためでお願いします。','멘와 카타메데 오네가이시마스'],['고수는 빼 주세요','パクチー抜きでお願いします。','파쿠치- 누키데 오네가이시마스'],['포장 되나요?','持ち帰りできますか？','모치카에리 데키마스카'],['얼마나 기다려요?','どのくらい待ちますか？','도노쿠라이 마치마스카'],['금연석 있나요?','禁煙席はありますか？','킨엔세키와 아리마스카'],['계산해 주세요','お会計お願いします。','오카이케- 오네가이시마스'],['카드 되나요?','カードは使えますか？','카-도와 츠카에마스카'],['따로 계산할게요','別々でお願いします。','베츠베츠데 오네가이시마스'],['잘 먹었습니다','ごちそうさまでした。','고치소-사마데시타']],
 '🚃 교통·길':[['〇〇역은 어디예요?','〇〇駅はどこですか？','〇〇 에키와 도코데스카'],['이 전철 〇〇에 가나요?','この電車は〇〇に行きますか？','코노 덴샤와 〇〇니 이키마스카'],['여기까지 가 주세요 (택시)','ここまでお願いします。','코코마데 오네가이시마스'],['걸어서 갈 수 있나요?','歩いて行けますか？','아루이테 이케마스카'],['화장실은 어디예요?','トイレはどこですか？','토이레와 도코데스카'],['코인로커는 어디예요?','コインロッカーはどこですか？','코인록카-와 도코데스카'],['표는 어디서 사요?','切符はどこで買えますか？','킵푸와 도코데 카에마스카']],
 '🛍️ 쇼핑·숙소':[['이거 얼마예요?','これはいくらですか？','코레와 이쿠라데스카'],['면세 되나요?','免税できますか？','멘제- 데키마스카'],['봉투는 필요 없어요','袋は要りません。','후쿠로와 이리마센'],['입어 봐도 돼요?','試着してもいいですか？','시차쿠시테모 이이데스카'],['체크인 부탁해요','チェックインをお願いします。','첵쿠인오 오네가이시마스'],['짐 맡아 주실 수 있나요?','荷物を預かってもらえますか？','니모츠오 아즈캇테 모라에마스카'],['와이파이 비밀번호 알려 주세요','Wi-Fiのパスワードを教えてください。','와이화이노 파스와-도오 오시에테 쿠다사이']],
 '🆘 긴급':[['도와주세요!','助けてください！','타스케테 쿠다사이'],['구급차를 불러 주세요','救急車を呼んでください。','큐-큐-샤오 욘데 쿠다사이'],['병원에 가고 싶어요','病院に行きたいです。','뵤-인니 이키타이데스'],['지갑을 잃어버렸어요','財布をなくしました。','사이후오 나쿠시마시타'],['여권을 잃어버렸어요','パスポートをなくしました。','파스포-토오 나쿠시마시타'],['파출소는 어디예요?','交番はどこですか？','코-반와 도코데스카'],['한국어 할 수 있는 분 있나요?','韓国語が話せる人はいますか？','칸코쿠고가 하나세루 히토와 이마스카']]
};
const ALLERGENS=[['새우','えび'],['게','かに'],['땅콩','落花生（ピーナッツ）'],['메밀','そば'],['밀','小麦'],['우유·유제품','乳製品'],['계란','卵'],['호두','くるみ'],['대두','大豆'],['생선','魚'],['조개류','貝類'],['오징어','いか'],['참깨','ごま'],['돼지고기','豚肉'],['소고기','牛肉'],['닭고기','鶏肉'],['알코올','アルコール'],['고수','パクチー']];
const CHECK_DEFAULT=['여권 (남은 유효기간 확인)','항공권·숙소 예약 확인','Visit Japan Web 입국·세관 QR 등록','여행자 보험','엔화 현금 조금 (시골·시장은 현금만 받는 곳 많음)','해외 결제 카드 (트래블 카드)','eSIM·유심·포켓와이파이','돼지코 (일본 100V · A타입 플러그)','보조배터리 (기내 휴대만, 위탁 수하물 금지)','충전기·케이블','상비약','교통 IC카드 (Suica·PASMO·ICOCA, 모바일 등록)','동전지갑','손수건 (핸드드라이어 없는 화장실 많음)','작은 쓰레기봉투 (길에 쓰레기통이 적음)','편한 신발·우산','이 앱에서 여행할 도도부현 음식점 DB 한 번 열어 두기 (오프라인 저장)'];

function toolsShell(){
  const root=$('v12Tools');if(!root)return;
  const rate=store.get('jz-v12-rate',null);
  root.innerHTML=`<div class="v12-tools">
  <article class="card"><h3>💴 엔화 ↔ 원화 계산기</h3>
   <div class="control"><label for="v12Rate">환율: 100엔 = ? 원 <small>(은행·카드 앱의 오늘 환율을 직접 입력)</small></label><input id="v12Rate" type="number" min="1" step="0.1" placeholder="예: 950" value="${esc(rate??'')}"></div>
   <div class="v12-two"><div class="control"><label for="v12Yen">엔 (¥)</label><input id="v12Yen" type="number" min="0" step="1" placeholder="1000"></div><div class="control"><label for="v12Won">원 (₩)</label><input id="v12Won" type="number" min="0" step="10" placeholder="9500"></div></div>
   <table class="charttable v12-quick" id="v12Quick"></table>
   <p class="tiny">인터넷 없이 계산돼요. 환율은 자동으로 바뀌지 않으니 출발 전에 한 번 입력해 두세요(이 기기에 저장).</p></article>
  <article class="card"><h3>🧾 소비세·면세 계산</h3>
   <div class="v12-two"><div class="control"><label for="v12Price">가격 (¥)</label><input id="v12Price" type="number" min="0" placeholder="5500"></div>
   <div class="control"><label for="v12TaxMode">표시 방식</label><select id="v12TaxMode"><option value="in">세금 포함 (税込)</option><option value="ex">세금 별도 (税抜·本体価格)</option></select></div></div>
   <div class="control"><label for="v12TaxRate">세율</label><select id="v12TaxRate"><option value="10">10% (일반·매장 식사·주류)</option><option value="8">8% (식료품·테이크아웃)</option></select></div>
   <div id="v12TaxOut" class="v12-out"></div>
   <p class="tiny">2026년 11월 1일부터 일본 면세는 <b>환급 방식</b>으로 바뀌었어요: 매장에서는 세금 포함 가격으로 결제하고, 출국할 때 세관에서 물건·여권 확인을 받은 뒤 환급받는 구조입니다. 기준은 한 매장·하루 세전 ¥5,000 이상. 환급 수수료·절차는 매장마다 다를 수 있으니 <a href="https://www.japan.travel/en/plan/tax-free-shopping/" target="_blank" rel="noopener noreferrer">JNTO 면세 안내 ↗</a>에서 확인하세요.</p></article>
  <article class="card"><h3>👥 더치페이 (割り勘)</h3>
   <div class="v12-two"><div class="control"><label for="v12SplitTotal">총액 (¥)</label><input id="v12SplitTotal" type="number" min="0" placeholder="12800"></div><div class="control"><label for="v12SplitN">인원</label><input id="v12SplitN" type="number" min="1" value="2"></div></div>
   <div id="v12SplitOut" class="v12-out"></div><p class="tiny">일본은 팁 문화가 없어요. 이자카야의 자릿세(お通し)는 보통 1인 ¥300~700 정도 별도로 붙을 수 있어요.</p></article>
  <article class="card v12-wide"><h3>✅ 여행 준비물 체크리스트</h3><div id="v12Check"></div>
   <div class="controls-row"><input id="v12CheckNew" placeholder="항목 추가" style="flex:1;min-width:160px;padding:9px;border:1px solid var(--line);border-radius:10px"><button class="btn dark" id="v12CheckAdd" type="button">추가</button><button class="btn" id="v12CheckReset" type="button">체크 모두 해제</button></div></article>
  <article class="card v12-wide"><h3>🗣️ 상황별 일본어 <small class="tiny">🔊 누르면 발음을 들려줘요 · ⤢ 누르면 크게 보여주기</small></h3>
   <div class="choicebar" id="v12PhraseTabs"></div><div id="v12Phrases" class="v12-phrases"></div></article>
  <article class="card"><h3>🚫 알레르기·못 먹는 음식 카드</h3><p class="tiny">해당 항목을 고르면 가게 직원에게 보여줄 일본어 카드가 만들어져요.</p>
   <div id="v12Allergy" class="v12-allergy"></div>
   <div class="control"><label for="v12AllergyType">이유</label><select id="v12AllergyType"><option value="a">알레르기가 있어요</option><option value="n">못 먹어요 (종교·취향)</option></select></div>
   <label class="tiny"><input type="checkbox" id="v12Veg"> 채식(고기·생선·가쓰오부시 육수 X)</label>
   <div id="v12AllergyCard" class="v12-showcard"></div><button class="btn dark" id="v12AllergyBig" type="button">⤢ 크게 보여주기</button></article>
  <article class="card"><h3>🆘 긴급 연락처</h3><ul class="v12-sos">
   <li><a href="tel:110"><b>110</b></a> 경찰 (사건·사고·분실)</li><li><a href="tel:119"><b>119</b></a> 구급차·소방</li><li><a href="tel:118"><b>118</b></a> 바다 사고 (해상보안청)</li>
   <li><a href="tel:+81-50-3816-2787"><b>050-3816-2787</b></a> Japan Visitor Hotline (JNTO, 24시간·한국어 가능) <a href="https://www.japan.travel/ko/plan/hotline/" target="_blank" rel="noopener noreferrer">안내 ↗</a></li>
   <li><a href="tel:+82-2-3210-0404"><b>+82-2-3210-0404</b></a> 외교부 영사콜센터 (24시간)</li>
   <li><a href="https://overseas.mofa.go.kr/jp-ko/index.do" target="_blank" rel="noopener noreferrer">주일본 대한민국 대사관 ↗</a> · 여권 분실 시 재발급·여행증명서</li></ul>
   <p class="tiny">번호는 바뀔 수 있으니 출국 전 공식 페이지에서 한 번 더 확인하세요.</p></article>
  <article class="card"><h3>💾 내 데이터 백업·복원</h3><p class="tiny">즐겨찾기·먹킷리스트·일정·체크리스트·저장한 가게·환율은 이 브라우저에만 저장돼요. 폰↔PC로 옮기거나 브라우저 정리 전에 파일로 백업하세요.</p>
   <div class="controls-row"><button class="btn dark" id="v12Backup" type="button">⬇️ 백업 파일 저장</button><label class="btn jz-file">⬆️ 백업 불러오기<input type="file" id="v12Restore" accept=".json,application/json" hidden></label></div><div id="v12BackupInfo" class="tiny"></div></article>
  <article class="card"><h3>📲 앱처럼 설치·오프라인</h3><p class="tiny">홈 화면에 추가하면 앱처럼 열리고, 한 번 연 화면·도도부현 음식점 데이터는 인터넷 없이도 열려요. (지도 타일·구글 지도 링크는 인터넷 필요)</p>
   <div class="controls-row"><button class="btn dark" id="v12Install" type="button" hidden>📲 홈 화면에 설치</button><span class="tiny" id="v12InstallHint">아이폰: 사파리 공유 버튼 → “홈 화면에 추가” · 안드로이드: 크롬 메뉴 → “앱 설치”</span></div><div id="v12OfflineInfo" class="tiny"></div></article>
  </div>`;
  // currency
  const Rate=$('v12Rate'),Yen=$('v12Yen'),Won=$('v12Won');
  const r=()=>Number(Rate.value)/100;
  const quick=()=>{const k=r();$('v12Quick').innerHTML=k?'<tbody>'+[100,500,1000,3000,5000,10000,30000].map(y=>`<tr><td>¥${y.toLocaleString('ja-JP')}</td><td>${fmt(Math.round(y*k))}원</td></tr>`).join('')+'</tbody>':'<tbody><tr><td>환율을 입력하면 빠른 환산표가 나와요.</td></tr></tbody>'};
  Rate.addEventListener('input',()=>{store.set('jz-v12-rate',Rate.value?Number(Rate.value):null);if(Yen.value)Won.value=Math.round(Yen.value*r());quick()});
  Yen.addEventListener('input',()=>{Won.value=Yen.value&&r()?Math.round(Yen.value*r()):''});
  Won.addEventListener('input',()=>{Yen.value=Won.value&&r()?Math.round(Won.value/r()):''});quick();
  // tax
  const tax=()=>{const p=Number($('v12Price').value),rt=Number($('v12TaxRate').value)/100,mode=$('v12TaxMode').value;if(!p){$('v12TaxOut').textContent='가격을 입력하세요.';return}
    const ex=mode==='in'?Math.round(p/(1+rt)):p,inc=mode==='in'?p:Math.floor(p*(1+rt)),t=inc-ex,k=r();
    $('v12TaxOut').innerHTML=`세전 <b>¥${ex.toLocaleString('ja-JP')}</b> · 세금 ¥${t.toLocaleString('ja-JP')} · 결제 <b>¥${inc.toLocaleString('ja-JP')}</b>${k?' ≈ '+fmt(Math.round(inc*k))+'원':''}<br>${ex>=5000?'✅ 면세(환급) 기준 세전 ¥5,000 이상 — 여권 지참, 출국 시 세관 확인 후 환급 · 예상 환급 약 ¥'+t.toLocaleString('ja-JP'):'ℹ️ 같은 매장에서 하루 세전 ¥5,000 이상이면 면세(환급) 대상이에요. ¥'+(5000-ex).toLocaleString('ja-JP')+' 더 필요'}`};
  ['v12Price','v12TaxMode','v12TaxRate'].forEach(id=>$(id).addEventListener('input',tax));tax();
  // split
  const split=()=>{const t=Number($('v12SplitTotal').value),n=Math.max(1,Number($('v12SplitN').value)||1),k=r();if(!t){$('v12SplitOut').textContent='총액을 입력하세요.';return}const per=Math.ceil(t/n);$('v12SplitOut').innerHTML=`1인 <b>¥${per.toLocaleString('ja-JP')}</b>${k?' ≈ '+fmt(Math.round(per*k))+'원':''} <span class="tiny">(올림 · 남는 금액 ¥${(per*n-t).toLocaleString('ja-JP')})</span>`};
  ['v12SplitTotal','v12SplitN'].forEach(id=>$(id).addEventListener('input',split));split();
  // checklist
  let check=store.get('jz-v12-check',null);if(!Array.isArray(check))check=CHECK_DEFAULT.map(t=>({t,d:false}));
  const drawCheck=()=>{store.set('jz-v12-check',check);const done=check.filter(c=>c.d).length;$('v12Check').innerHTML=`<div class="tiny">${done} / ${check.length} 완료</div><ul class="v12-checklist">`+check.map((c,i)=>`<li class="${c.d?'done':''}"><label><input type="checkbox" data-ci="${i}" ${c.d?'checked':''}> ${esc(c.t)}</label><button type="button" class="jz-iconbtn" data-cdel="${i}" aria-label="삭제">×</button></li>`).join('')+'</ul>'};
  $('v12Check').addEventListener('change',e=>{const i=e.target.dataset.ci;if(i!==undefined){check[+i].d=e.target.checked;drawCheck()}});
  $('v12Check').addEventListener('click',e=>{const b=e.target.closest('[data-cdel]');if(b){check.splice(+b.dataset.cdel,1);drawCheck()}});
  const addC=()=>{const v=$('v12CheckNew').value.trim();if(!v)return;check.push({t:v.slice(0,120),d:false});$('v12CheckNew').value='';drawCheck()};
  $('v12CheckAdd').addEventListener('click',addC);$('v12CheckNew').addEventListener('keydown',e=>{if(e.key==='Enter')addC()});
  $('v12CheckReset').addEventListener('click',()=>{check.forEach(c=>c.d=false);drawCheck()});drawCheck();
  // phrases
  const cats=Object.keys(PHRASES);let cat=cats[0];
  const drawPh=()=>{$('v12PhraseTabs').innerHTML=cats.map(c=>`<button type="button" class="pill ${c===cat?'on':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    $('v12Phrases').innerHTML=PHRASES[cat].map((p,i)=>`<div class="v12-phrase"><div><b>${esc(p[0])}</b><div class="v12-jp">${esc(p[1])}</div><div class="tiny">${esc(p[2])}</div></div><div class="v12-ph-btn"><button type="button" class="btn" data-say="${i}" aria-label="발음 듣기">🔊</button><button type="button" class="btn" data-big="${i}" aria-label="크게 보기">⤢</button></div></div>`).join('')};
  $('v12PhraseTabs').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(b){cat=b.dataset.cat;drawPh()}});
  $('v12Phrases').addEventListener('click',e=>{const s=e.target.closest('[data-say]'),g=e.target.closest('[data-big]');if(s)say(PHRASES[cat][+s.dataset.say][1]);if(g){const p=PHRASES[cat][+g.dataset.big];big(p[1],p[0])}});drawPh();
  // allergy
  let al=store.get('jz-v12-allergy',[]);if(!Array.isArray(al))al=[];
  $('v12Allergy').innerHTML=ALLERGENS.map((a,i)=>`<label class="pill"><input type="checkbox" data-al="${i}" ${al.includes(i)?'checked':''}> ${esc(a[0])}</label>`).join('');
  const alText=()=>{const items=al.map(i=>ALLERGENS[i][1]);const veg=$('v12Veg').checked;let t='';
    if(items.length)t+=($('v12AllergyType').value==='a'?'私は次の食べ物にアレルギーがあります。':'私は次の食べ物が食べられません。')+'\n【'+items.join('・')+'】\n'+'これらが入っていない料理はありますか？（だし・調味料も含みます）';
    if(veg)t+=(t?'\n\n':'')+'私はベジタリアンです。肉・魚（かつおだし等を含む）は食べられません。';
    return t};
  const drawAl=()=>{store.set('jz-v12-allergy',al);const t=alText();$('v12AllergyCard').textContent=t||'항목을 선택하세요.'};
  $('v12Allergy').addEventListener('change',e=>{const i=+e.target.dataset.al;al=e.target.checked?[...new Set([...al,i])]:al.filter(x=>x!==i);drawAl()});
  ['v12AllergyType','v12Veg'].forEach(id=>$(id).addEventListener('change',drawAl));
  $('v12AllergyBig').addEventListener('click',()=>{const t=alText();if(t)big(t,'가게 직원에게 보여주세요')});drawAl();
  // backup
  $('v12Backup').addEventListener('click',()=>{const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^(jz-|japan-)/.test(k))out[k]=localStorage.getItem(k)}
    const blob=new Blob([JSON.stringify({type:'JAPAN-ZIP-BACKUP',v:12,at:new Date().toISOString(),data:out},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='JAPAN_ZIP_backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();
    $('v12BackupInfo').textContent='✓ '+Object.keys(out).length+'개 항목을 저장했어요.'});
  $('v12Restore').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.type!=='JAPAN-ZIP-BACKUP'||typeof o.data!=='object')throw new Error('JAPAN ZIP 백업 파일이 아니에요');
    if(!confirm('백업을 불러오면 이 브라우저의 같은 항목이 덮어써져요. 계속할까요?'))return;let n=0;for(const [k,v] of Object.entries(o.data)){if(/^(jz-|japan-)/.test(k)&&typeof v==='string'){localStorage.setItem(k,v);n++}}
    alert(n+'개 항목을 복원했어요. 화면을 새로고침합니다.');location.reload()}catch(err){alert('복원 실패: '+err.message)}e.target.value=''});
}
function say(text){
  if(!('speechSynthesis' in window)){toast('이 브라우저는 음성 읽기를 지원하지 않아요');return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/〇〇/g,'まる まる'));u.lang='ja-JP';u.rate=.9;
  const v=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u);
}
function big(text,sub){
  let o=$('v12Big');if(!o){o=document.createElement('div');o.id='v12Big';o.className='v12-big';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');document.body.append(o);o.addEventListener('click',e=>{if(e.target.closest('[data-say-big]')){say(o.dataset.text);return}o.hidden=true})}
  o.dataset.text=text;o.innerHTML=`<div class="v12-big-card"><small>${esc(sub||'')}</small><p>${esc(text).replace(/\n/g,'<br>')}</p><div class="controls-row" style="justify-content:center"><button class="btn" type="button" data-say-big>🔊 읽어 주기</button><button class="btn dark" type="button">닫기</button></div></div>`;o.hidden=false;
}

/* ------------------------------------------------------------------ */
/* 3. PWA                                                              */
/* ------------------------------------------------------------------ */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;const b=$('v12Install');if(b)b.hidden=false});
function pwa(){
  const b=$('v12Install');b?.addEventListener('click',async()=>{if(!installEvt)return;installEvt.prompt();await installEvt.userChoice;installEvt=null;b.hidden=true});
  if(/^https?:$/.test(location.protocol)&&'serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').then(()=>{const i=$('v12OfflineInfo');if(i)i.textContent='✓ 오프라인 저장 켜짐 · 열어 본 도도부현 데이터는 자동으로 저장돼요.'}).catch(()=>{});
  }else{const i=$('v12OfflineInfo');if(i)i.textContent='ℹ️ 오프라인 저장은 GitHub Pages 같은 https 주소에서 열었을 때만 동작해요.'}
}

/* ------------------------------------------------------------------ */
/* boot                                                                 */
/* ------------------------------------------------------------------ */
fzShell();toolsShell();pwa();
// 홈의 "저장한 장소" → 장소 찾기의 저장 목록
const favBtn=$('zipFavorites');
if(favBtn){const nb=favBtn.cloneNode(true);favBtn.replaceWith(nb);nb.addEventListener('click',()=>{F.fav=true;document.querySelector('a[data-go="find"]')?.click();refresh()})}
refresh();
loadAwards().then(()=>{if(F.doc&&AW)matchAwards(F.doc);refresh()});
loadIndex().then(async()=>{
  const p=new URLSearchParams(location.search).get('pref');
  if(p&&SLUG[p])await choosePref(p);else refresh();
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){const o=$('v12Big');if(o&&!o.hidden)o.hidden=true}});
})();
