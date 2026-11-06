/* JAPAN ZIP — 가게 대표메뉴·가격대 추정 + 관광명소 설명 + 추천 일정에 전체 가게 반영 + 엑셀·PDF 저장. 무료, API 키 없음 */
(()=>{
'use strict';
/* ---------- 이 가게는 뭘 파는 곳? (이름·장르 태그로 추정) ---------- */
// [키, 이름에 들어간 일본어, 한국어 이름, 설명, 최저가, 최고가]  가격 = 이런 종류 가게의 보통 1인 가격대 (추정)
const FOOD=[
 ['kaiten',/回転|スシロー|くら寿司|はま寿司|かっぱ寿司|魚べい|元気寿司/,'회전초밥','접시에 담긴 초밥을 골라 먹는 곳',1000,2500],
 ['ramen',/ラーメン|らーめん|らぁめん|拉麺|中華そば|つけ麺|麺屋|麺処|担々麺|一蘭|一風堂|天下一品/,'라멘','라멘·츠케멘·교자',800,1300],
 ['gyudon',/吉野家|すき家|松屋|なか卯|牛丼|天丼てんや/,'규동·덮밥','규동·덮밥 체인 (빠르고 저렴)',450,1000],
 ['famires',/ガスト|デニーズ|ジョナサン|ココス|ロイヤルホスト|びっくりドンキー|サイゼリヤ|バーミヤン/,'패밀리 레스토랑','함박·파스타·도리아 등 다양한 메뉴',700,1500],
 ['udon',/うどん|饂飩|丸亀製麺|はなまる/,'우동','우동·튀김 토핑',400,1000],
 ['soba',/そば|蕎麦|そば処/,'소바','메밀국수·튀김',700,1500],
 ['sushi',/寿司|鮨|すし|スシ/,'초밥','초밥·사시미',1500,4000],
 ['yakiniku',/焼肉|焼き肉|ホルモン|ジンギスカン/,'야키니쿠','고기를 직접 구워 먹는 곳',3000,6000],
 ['yakitori',/焼鳥|焼き鳥|やきとり|串焼|鳥貴族/,'야키토리','닭꼬치와 술',2500,4500],
 ['kushikatsu',/串カツ|串かつ|串揚/,'쿠시카츠','꼬치 튀김과 술',2000,4000],
 ['izakaya',/居酒屋|酒場|酒処|酒房|呑み処|立ち飲み|立飲/,'이자카야','술과 다양한 안주',3000,5000],
 ['tonkatsu',/とんかつ|豚カツ|かつや|勝烈/,'돈카츠','돈카츠 정식',1200,2500],
 ['tempura',/天ぷら|天麩羅|天丼/,'튀김(덴푸라)','튀김 정식·덴동',1200,3000],
 ['unagi',/うなぎ|鰻/,'장어','장어덮밥(우나동·히쓰마부시)',3000,6000],
 ['shabu',/しゃぶしゃぶ|すき焼|すきやき/,'샤부샤부·스키야키','고기 전골',3000,7000],
 ['okonomi',/お好み焼|もんじゃ/,'오코노미야키','철판 부침·몬자야키',900,1800],
 ['takoyaki',/たこ焼|たこやき/,'타코야키','문어 풀빵 간식',500,900],
 ['curry',/カレー|CoCo壱|ココイチ/,'카레','일본식 카레라이스',800,1500],
 ['teishoku',/定食|食堂|やよい軒|大戸屋|めし処|めしや/,'정식(백반)','밥·국·반찬 세트',800,1300],
 ['seafood',/海鮮|浜焼|魚河岸|漁師|かき小屋|牡蠣|丼屋/,'해산물','카이센동·생선구이',1500,3500],
 ['chinese',/中華|餃子|飯店|酒家|王将|担担|小籠包/,'중화요리','교자·볶음밥·마파두부',800,1500],
 ['korean',/韓国|冷麺|ビビンバ|サムギョプサル/,'한식','한국 요리',1000,2500],
 ['italian',/イタリアン|パスタ|トラットリア|オステリア|リストランテ/,'이탈리안','파스타·피자',1200,2500],
 ['pizza',/ピザ|ピッツァ|ピッツェリア/,'피자','피자',1000,2500],
 ['french',/フレンチ|ビストロ|ブラッスリー/,'프렌치','프랑스 요리 코스·비스트로',2500,8000],
 ['steak',/ステーキ|いきなり/,'스테이크','스테이크·햄버그',2000,5000],
 ['yoshoku',/洋食|オムライス|ハンバーグ|グリル/,'일본식 양식','오므라이스·함박·카레',1000,2000],
 ['burger',/バーガー|マクドナルド|モスバーガー|ロッテリア|ケンタッキー/,'햄버거·치킨','햄버거·치킨 세트',500,1200],
 ['starbucks',/スターバックス|ドトール|タリーズ|コメダ|エクセルシオール|上島珈琲|サンマルク/,'체인 카페','커피·라테·디저트',400,1000],
 ['kissa',/喫茶|純喫茶/,'킷사텐(옛날 찻집)','핸드드립 커피·토스트·푸딩',500,1200],
 ['cafe',/カフェ|珈琲|コーヒー|Cafe|CAFE|café|Coffee|COFFEE/,'카페','커피·차·디저트',500,1200],
 ['bakery',/パン|ベーカリー|ブーランジェリー|Bakery|BAKERY/,'빵집','갓 구운 빵 (개당)',200,600],
 ['sweets',/菓子|ケーキ|パティスリー|甘味|和菓子|洋菓子|団子|だんご|まんじゅう|大福/,'디저트·과자','케이크·화과자·단고',300,1500],
 ['bar',/バー|BAR|Bar/,'바','칵테일·위스키 (1인 2~3잔 기준)',2000,5000],
];
const TAG={ramen:'ramen',noodle:'ramen',udon:'udon',soba:'soba',sushi:'sushi',yakiniku:'yakiniku',yakitori:'yakitori',kushikatsu:'kushikatsu',izakaya:'izakaya',tonkatsu:'tonkatsu',tempura:'tempura',unagi:'unagi',eel:'unagi',shabu_shabu:'shabu',sukiyaki:'shabu',okonomiyaki:'okonomi',takoyaki:'takoyaki',curry:'curry',teishoku:'teishoku',japanese:'teishoku',seafood:'seafood',fish:'seafood',chinese:'chinese',gyoza:'chinese',korean:'korean',italian:'italian',pasta:'italian',pizza:'pizza',french:'french',steak_house:'steak',steak:'steak',western:'yoshoku',yoshoku:'yoshoku',burger:'burger',chicken:'burger',fried_chicken:'burger',beef_bowl:'gyudon',donburi:'gyudon',coffee_shop:'cafe',cake:'sweets',dessert:'sweets',wagashi:'sweets',japanese_sweets:'sweets',bakery:'bakery'};
const KINDFOOD={i:'izakaya',c:'cafe',k:'bakery',b:'bar',p:'bar',f:'burger'};
const OTHER={s:['마트','도시락·반찬·과일·음료',300,1000],v:['편의점','도시락·오니기리·간식·음료',200,800],r:['식당','메뉴 정보 없음 — 📷 메뉴 사진으로 확인',0,0]};
// 관광명소: 무엇을 하는 곳인지
const SPOT=[
 [/神社|神宮|大社|八幡|稲荷|天満宮|宮$/,'⛩️','신사','참배하고 경내를 산책하는 곳 · 오미쿠지(운세)·부적','보통 무료'],
 [/寺|院$|観音|大仏|不動尊/,'🛕','사찰(절)','불상·정원·건축을 둘러보는 곳','무료~¥500 (입장료가 있는 곳도 있음)'],
 [/城|天守/,'🏯','성','천수각에 올라 전망과 성 내부 전시를 보는 곳','보통 ¥300~1,000'],
 [/水族館|アクアリウム/,'🐠','수족관','바다 생물 관람·돌고래 쇼','보통 ¥2,000~3,500'],
 [/動物園|サファリ|どうぶつ/,'🦁','동물원','동물 관람·먹이 주기 체험','보통 ¥500~2,500'],
 [/植物園|フラワー|花園|ガーデン/,'🌷','식물원·꽃 정원','계절 꽃과 정원 산책','무료~¥1,000'],
 [/庭園|園$/,'🌿','정원','일본식 정원을 산책하며 경치를 보는 곳','무료~¥1,000'],
 [/美術館|ギャラリー|アート/,'🖼️','미술관','그림·작품 전시 관람','보통 ¥500~2,000'],
 [/博物館|資料館|記念館|ミュージアム|歴史館|科学館|郷土館/,'🏛️','박물관·전시관','지역 역사·문화·과학 전시 관람','무료~¥1,500'],
 [/タワー|展望|スカイ/,'🗼','전망대·타워','높은 곳에서 도시·자연 경치를 보는 곳','무료~¥3,000'],
 [/温泉|湯$|の湯|乃湯|スパ|銭湯|浴場/,'♨️','온천·목욕탕','온천욕 (수건 대여·판매 있는 곳 많음)','보통 ¥500~1,500'],
 [/滝/,'💦','폭포','폭포 경치 감상·산책','보통 무료'],
 [/渓谷|峡|渓/,'🏞️','계곡','계곡 트레킹·단풍 명소','보통 무료'],
 [/湖|池|沼/,'🛶','호수','호숫가 산책·유람선','무료 (유람선은 별도)'],
 [/海岸|浜|ビーチ|岬|灯台|島/,'🌊','바닷가·곶','바다 경치·해변 산책','보통 무료'],
 [/山|岳|峠|高原/,'⛰️','산·고원','등산·트레킹·전망','무료 (로프웨이는 별도)'],
 [/洞|鍾乳/,'🕳️','동굴','종유동 탐험','보통 ¥500~1,500'],
 [/公園|パーク/,'🌳','공원','산책·피크닉·계절 꽃','보통 무료'],
 [/ランド|遊園地|テーマパーク|ワールド/,'🎢','테마파크','놀이기구·쇼','¥1,000~10,000'],
 [/牧場|ファーム|農園/,'🐄','목장·농장','동물 체험·아이스크림·과일 따기','무료~¥2,000'],
 [/酒造|醸造|蔵元|ワイナリー|蒸溜所|ブルワリー/,'🍶','양조장','견학·시음·기념품','무료~¥1,500'],
 [/工房|体験/,'🧶','공방·체험','공예 체험 (예약 권장)','¥1,000~5,000'],
 [/市場|朝市/,'🐟','시장','먹거리 구경·해산물 시식','입장 무료'],
 [/商店街|横丁|小路/,'🏮','상점가·골목','골목 상점·먹거리 구경','입장 무료'],
 [/橋/,'🌉','다리','명소 다리 산책·사진','무료'],
 [/古墳|遺跡|跡$|史跡/,'🏺','유적','역사 유적 산책','보통 무료'],
 [/駅$/,'🚉','역·전망 명소','역 주변 명소','무료'],
];
const SPOT_KIND={o:['♨️','온천·목욕탕','온천욕 (수건 대여·판매 있는 곳 많음)','보통 ¥500~1,500'],m:['🏛️','박물관·미술관','전시 관람','무료~¥1,500'],h:['🏯','성','성곽·천수각 관람','보통 ¥300~1,000']};
const SUB_SPOT={viewpoint:['🔭','전망 포인트','경치 감상·사진 찍기','무료'],zoo:['🦁','동물원','동물 관람','보통 ¥500~2,500'],aquarium:['🐠','수족관','바다 생물 관람','보통 ¥2,000~3,500'],theme_park:['🎢','테마파크','놀이기구·쇼','¥1,000~10,000'],gallery:['🖼️','갤러리','작품 전시 관람','무료~¥1,000'],museum:['🏛️','박물관','전시 관람','무료~¥1,500']};
const yen=n=>'¥'+Number(n).toLocaleString('ja-JP');
function jzGuess(r){
  const name=String(r[1]||'')+' '+String(r[2]||''),k=r[3],tags=String(r[4]||'').toLowerCase().split(';').map(x=>x.trim()),sub=r[12]||'',desc=r[13]||'';
  if('omha'.includes(k)){
    let s=SPOT.find(x=>x[0].test(r[1]||''));
    if(s)return {spot:true,icon:s[1],label:s[2],what:s[3],price:s[4],desc};
    const t=SUB_SPOT[sub]||SPOT_KIND[k];
    if(t)return {spot:true,icon:t[0],label:t[1],what:t[2],price:t[3],desc};
    return {spot:true,icon:'📍',label:'관광명소',what:'무엇을 하는 곳인지는 📷 사진·지도에서 확인',price:'',desc};
  }
  let f=FOOD.find(x=>x[1].test(name));let src='name';
  if(!f){for(const t of tags){const key=TAG[t];if(key){f=FOOD.find(x=>x[0]===key);src='tag';break}}}
  if(!f&&KINDFOOD[k]){f=FOOD.find(x=>x[0]===KINDFOOD[k]);src='kind'}
  if(f)return {spot:false,label:f[2],what:f[3],lo:f[4],hi:f[5],price:'보통 1인 '+yen(f[4])+'~'+yen(f[5]),src,desc};
  const o=OTHER[k]||OTHER.r;
  return {spot:false,label:o[0],what:o[1],lo:o[2],hi:o[3],price:o[2]?'보통 '+yen(o[2])+'~'+yen(o[3]):'',src:'kind',desc};
}
const escH=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function jzMenuLine(r,place){
  const g=jzGuess(r);
  const photo='https://www.google.com/search?tbm=isch&q='+encodeURIComponent((r[1]||'')+' '+(place||'')+(g.spot?'':' メニュー'));
  const head=g.spot?`${g.icon} <b>${escH(g.label)}</b> — ${escH(g.what)}`:`🍽️ <b>${escH(g.label)}</b> — ${escH(g.what)}`;
  return `<div class="jz-menu-line">${head}${g.price?`<div class="jz-price">💴 ${escH(g.price)} <small>(이런 ${g.spot?'곳':'가게'}의 일반적인 가격대 · 추정)</small></div>`:''}${g.desc?`<div class="jz-odesc">“${escH(g.desc)}”</div>`:''}<a class="jz-photo" target="_blank" rel="noopener noreferrer" href="${photo}">📷 ${g.spot?'사진':'메뉴 사진'} 보기 ↗</a></div>`;
}
window.jzGuess=jzGuess;window.jzMenuLine=jzMenuLine;
{const css=document.createElement('style');css.textContent='.jz-menu-line{font-size:13px;color:#2f4a40;background:#f7faf6;border-radius:10px;padding:8px 10px;line-height:1.55}.jz-price{color:#8a6a2a;font-weight:700;font-size:12px}.jz-price small{font-weight:500;color:#9a8a6a}.jz-odesc{font-size:12px;color:#5b6b64;margin-top:2px}.jz-photo{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;color:var(--blue,#375f93)}';document.head.append(css)}

if(typeof buildSchedule!=='function'||typeof renderSchedule!=='function')return;
const q=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gmaps=s=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s);
const st={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const SLUG={"홋카이도":"hokkaido","아오모리":"aomori","이와테":"iwate","미야기":"miyagi","아키타":"akita","야마가타":"yamagata","후쿠시마":"fukushima","이바라키":"ibaraki","도치기":"tochigi","군마":"gunma","사이타마":"saitama","지바":"chiba","도쿄":"tokyo","가나가와":"kanagawa","니가타":"niigata","도야마":"toyama","이시카와":"ishikawa","후쿠이":"fukui","야마나시":"yamanashi","나가노":"nagano","기후":"gifu","시즈오카":"shizuoka","아이치":"aichi","미에":"mie","시가":"shiga","교토":"kyoto","오사카":"osaka","효고":"hyogo","나라":"nara","와카야마":"wakayama","돗토리":"tottori","시마네":"shimane","오카야마":"okayama","히로시마":"hiroshima","야마구치":"yamaguchi","도쿠시마":"tokushima","가가와":"kagawa","에히메":"ehime","고치":"kochi","후쿠오카":"fukuoka","사가":"saga","나가사키":"nagasaki","구마모토":"kumamoto","오이타":"oita","미야자키":"miyazaki","가고시마":"kagoshima","오키나와":"okinawa"};
const KIND={r:'식당',i:'이자카야',f:'패스트푸드·덮밥',c:'카페',b:'바',p:'펍',k:'빵·과자',s:'마트',v:'편의점',o:'온천·목욕탕',m:'박물관·미술관',h:'성',a:'관광명소'};
const CK={japanese:'일식',ramen:'라멘',sushi:'초밥',noodle:'면 요리',soba:'소바',udon:'우동',chinese:'중식',italian:'이탈리안',yakiniku:'야키니쿠',curry:'카레',burger:'햄버거',korean:'한식',coffee_shop:'커피',pizza:'피자',french:'프렌치',tempura:'튀김',tonkatsu:'돈카츠',yakitori:'야키토리',okonomiyaki:'오코노미야키',seafood:'해산물',beef_bowl:'규동',donburi:'덮밥',cake:'케이크',izakaya:'이자카야',gyoza:'교자',unagi:'장어'};
const ck=c=>c.split(';').map(x=>CK[x.trim().toLowerCase()]||x.trim()).filter(Boolean).slice(0,2).join('·');
const WESTERN=/italian|french|pizza|burger|pasta|steak|american|western|yoshoku|spanish|german|hamburg/;
const CHINESE=/chinese|gyoza|dumpling|ramen_chinese|taiwanese|champon/;
function genreOf(r){const k=r[3],c=(r[4]||'').toLowerCase();
  if('omha'.includes(k))return '볼거리·체험';if(k==='c'||k==='k')return '카페·디저트';if(k==='b'||k==='p'||k==='i')return '술집';if(k==='s'||k==='v')return '마트·쇼핑';
  if(CHINESE.test(c))return '중식';if(WESTERN.test(c))return '양식';return '일식'}
function dist(a,b,c,d){const R=6371,t=Math.PI/180,x=(c-a)*t,y=(d-b)*t,h=Math.sin(x/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}

/* ---------- 전체 가게 데이터 (도도부현별 JSON) ---------- */
const docs=new Map(),loading=new Set();
function neededPrefs(){
  if(zipPlanPrefs.length)return [...new Set(zipPlanPrefs)];
  const z=prefs.zone;
  if(z==='일본 전체')return ['오사카'];
  if(z.endsWith(' 전체')&&JAPAN_REGIONS[z.slice(0,-3)])return JAPAN_REGIONS[z.slice(0,-3)];
  if(SLUG[z])return [z];
  return ['후쿠오카'];
}
function ensureDocs(){
  if(!/^https?:$/.test(location.protocol)||mode()==='cur')return;
  for(const p of neededPrefs()){const s=SLUG[p];if(!s||docs.has(s)||loading.has(s))continue;loading.add(s);
    fetch('data/osm/'+s+'.json').then(r=>r.ok?r.json():null).then(d=>{if(d){docs.set(s,d);renderSchedule()}}).catch(()=>{}).finally(()=>loading.delete(s))}
}

/* ---------- 일정 생성 ---------- */
const MODE_KEY='jz-plan-source';
const mode=()=>st.get(MODE_KEY,'mix');
const THEME_CUISINE={noodles:/ramen|udon|soba|noodle/,seafood:/sushi|seafood|fish|kaisen/,chinese:CHINESE,western:WESTERN,gyoza:/gyoza|kushikatsu|kushiage/,japanese:/japanese|teishoku|washoku|tempura|tonkatsu/,food:/./,lunch:/teishoku|japanese|ramen|udon|soba|curry|donburi|beef_bowl/};
function slotsFor(last){
  const meal=['r','f','i'];
  const s=[['10:00',['a','m','h','o'],['c','k']],['12:00',meal,[]],['14:30',['a','m','h','o'],['c','k']]];
  if(last)s.push(['출발 전',['s','k'],['c']]);else s.push(['18:00',['i','r'],['p','b']],['20:00',['b','p','i'],['c','k']]);
  return s;
}
function osmPlace(r,doc,slug,prev){
  const city=(doc.cities[r[7]]?.[0]||'')+(r[8]?' '+r[8]:'');
  const d=prev?dist(prev.lat,prev.lon,r[5],r[6]):null;
  return {id:'osm:'+slug+':'+r[0],name:r[1],jp:r[1],pref:doc.pref,area:city||doc.jp,genre:genreOf(r),sub:KIND[r[3]]||'',
    menu:(()=>{const g=jzGuess(r);return g.label+' — '+g.what+' (📋 전체 가게)'})(),
    price:(d!=null?'이전 장소에서 약 '+(d<1?Math.round(d*1000)+'m':d.toFixed(1)+'km')+' · ':'')+(jzGuess(r).price||'가격은 지도에서 확인')+(jzGuess(r).price?' (추정)':''),
    map:gmaps(r[1]+' '+(doc.cities[r[7]]?.[0]||doc.jp)),lat:r[5],lon:r[6],hours:r[9]||'',osm:true,desc:'OpenStreetMap 전체 가게',priceCheck:'estimate'};
}
function planDayOSM(doc,slug,k,last,used,keepTimes){
  const counts={};doc.rows.forEach(r=>{if(r[7]>=0)counts[r[7]]=(counts[r[7]]||0)+1});
  const cities=Object.keys(counts).map(Number).filter(c=>counts[c]>=6).sort((a,b)=>counts[b]-counts[a]);
  const city=cities.length?cities[k%cities.length]:-1;
  const inCity=doc.rows.filter(r=>city<0||r[7]===city);
  const lat=inCity.map(r=>r[5]).sort((a,b)=>a-b),lon=inCity.map(r=>r[6]).sort((a,b)=>a-b);
  let prev={lat:lat[lat.length>>1]||0,lon:lon[lon.length>>1]||0};
  const themeRe=THEME_CUISINE[prefs.theme];
  const out=[];
  for(const [t,kinds,fallback] of slotsFor(last)){
    if(keepTimes&&keepTimes.has(t))continue;
    let best=null,bs=1e9;
    for(const pass of [kinds,fallback]){
      for(const r of doc.rows){
        if(!pass.includes(r[3])||used.has(r[0]))continue;
        const d=dist(prev.lat,prev.lon,r[5],r[6]);if(d>40)continue;
        let s=d+(r[7]===city?0:1.5)+(r[11]?0.8:0)+(r[9]?0:0.3);
        if(t==='12:00'||t==='18:00'){if(themeRe&&prefs.theme!=='food'&&!themeRe.test((r[4]||'').toLowerCase()))s+=2;if(prefs.genre!=='전체'&&genreOf(r)!==prefs.genre)s+=3}
        if(s<bs){bs=s;best=r}
      }
      if(best)break;
    }
    if(best){used.add(best[0]);const p=osmPlace(best,doc,slug,prev);out.push({t,p});prev={lat:best[5],lon:best[6]}}
  }
  return {items:out,cityName:city>=0?doc.cities[city][0]:''};
}
const nativeBuild=buildSchedule;
buildSchedule=function(){
  const cards=nativeBuild();const m=mode();if(m==='cur')return cards;
  const used=new Set(),perPref={};
  cards.forEach((day,i)=>{
    const pref=String(day.zone).split(' · ')[0];const slug=SLUG[pref];const doc=slug&&docs.get(slug);if(!doc)return;
    const k=perPref[pref]=(perPref[pref]??-1)+1;const last=i===cards.length-1;
    if(m==='osm'){const r=planDayOSM(doc,slug,k,last,used,null);if(r.items.length){day.items=r.items;day.zone=pref+' · '+(r.cityName||pref)}}
    else{const have=new Set(day.items.map(x=>x.t));const r=planDayOSM(doc,slug,k,last,used,have);
      if(r.items.length){const order=['10:00','12:00','14:30','18:00','20:00','출발 전'];day.items=[...day.items,...r.items].sort((a,b)=>order.indexOf(a.t)-order.indexOf(b.t))}}
  });
  return cards;
};

/* ---------- 일정 화면: 모드 선택 + 하루 동선 지도 ---------- */
const nativeRender=renderSchedule;
renderSchedule=function(){
  nativeRender();ensureDocs();
  const cards=buildSchedule();
  q('#days')?.querySelectorAll('article.day').forEach((art,i)=>{
    const items=cards[i]?.items||[];if(items.length<2||art.querySelector('.jz-route-link'))return;
    const pt=p=>p.lat!=null?p.lat+','+p.lon:(p.jp||p.name)+' '+(p.pref||'');
    const pts=items.map(o=>pt(o.p));
    const url='https://www.google.com/maps/dir/?api=1&travelmode=transit&origin='+encodeURIComponent(pts[0])+'&destination='+encodeURIComponent(pts[pts.length-1])+(pts.length>2?'&waypoints='+encodeURIComponent(pts.slice(1,-1).join('|')):'');
    const a=document.createElement('a');a.className='btn jz-route-link';a.target='_blank';a.rel='noopener noreferrer';a.href=url;a.textContent='🗺️ 이 날 동선 구글 지도로 보기 ↗';
    (art.querySelector('footer')||art).append(a);
  });
  const n=cards.reduce((s,d)=>s+d.items.filter(x=>x.p.osm).length,0);
  const info=q('#jzPlanSourceInfo');if(info)info.textContent=mode()==='cur'?'추천 도감 1,129곳만 사용 중':n?`📋 전체 가게 ${n}곳이 들어갔어요 (좌표 기준 가까운 순으로 연결)`:loading.size?'📋 전체 가게 데이터를 불러오는 중…':'';
};
(function ui(){
  const anchor=q('#planExplain');if(!anchor)return;
  const box=document.createElement('div');box.className='jz-plan-source';
  box.innerHTML=`<label for="jzPlanSource">일정에 쓸 장소</label><select id="jzPlanSource"><option value="mix">⭐ 추천 도감 우선 + 빈 칸은 📋 전체 가게</option><option value="osm">📋 전체 가게로 가까운 동선 짜기 (시골 추천)</option><option value="cur">⭐ 추천 도감만</option></select><span class="tiny" id="jzPlanSourceInfo"></span>`;
  anchor.after(box);const sel=q('#jzPlanSource');sel.value=mode();
  sel.addEventListener('change',()=>{st.set(MODE_KEY,sel.value);try{jzSuggestedEdits={};jzRememberEdits()}catch(e){}renderSchedule()});
})();

/* ---------- 엑셀 저장 ---------- */
let xlsxP=null;
function loadXLSX(){if(window.XLSX)return Promise.resolve();if(xlsxP)return xlsxP;
  xlsxP=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=ok;s.onerror=()=>{xlsxP=null;no(new Error('엑셀 라이브러리를 불러오지 못했어요'))};document.head.append(s)});return xlsxP}
function rowsMyTrip(){
  const days=st.get('jz-trip-v10',[]);const out=[];
  (Array.isArray(days)?days:[]).forEach((d,i)=>(d.items||[]).forEach((p,j)=>out.push({'DAY':i+1,'날짜 제목':d.title||'','순서':j+1,'시간':p.time||'','장소':p.name||'','도도부현':p.pref||'','지역':p.area||'','메모':p.notes||'','구글 지도':gmaps([p.name,p.area,p.pref].filter(Boolean).join(' '))})));
  return out;
}
function rowsPlan(){
  const out=[];buildSchedule().forEach((d,i)=>d.items.forEach((o,j)=>out.push({'DAY':i+1,'지역':d.zone,'시간':o.t,'장소':o.p.name,'일본어':o.p.jp||'','종류':o.p.genre||'','메뉴·내용':o.p.menu||'','가격·거리':o.p.price||'','출처':o.p.osm?'전체 가게(OSM)':'JAPAN ZIP 추천','구글 지도':o.p.map||gmaps(o.p.name)})));
  return out;
}
function rowsSaved(){
  const out=[];const cur=new Set(st.get('japan-atlas-faves',[]));
  (typeof DATA!=='undefined'?DATA:[]).filter(p=>cur.has(p.id)).forEach(p=>out.push({'구분':'⭐ 추천','장소':p.name,'일본어':p.jp,'도도부현':p.pref,'지역':p.area,'종류':p.genre,'메뉴':p.menu,'가격':p.price,'영업시간':'','구글 지도':p.map}));
  Object.values(st.get('jz-osm-faves-v12',{})).forEach(v=>out.push({'구분':'📋 전체 가게','장소':v.name,'일본어':v.alt||'','도도부현':v.pref,'지역':v.city||'','종류':KIND[v.kind]||'','메뉴':v.cuisine?ck(v.cuisine):'','가격':'','영업시간':v.hours||'','구글 지도':gmaps(v.name+' '+(v.city||v.pref))}));
  return out;
}
async function saveExcel(){
  const sheets=[['내 일정',rowsMyTrip()],['추천 일정',rowsPlan()],['저장한 장소',rowsSaved()]];
  const name='JAPAN_ZIP_trip_'+new Date().toISOString().slice(0,10);
  try{await loadXLSX();
    const wb=XLSX.utils.book_new();
    for(const [n,rows] of sheets){const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{'안내':'내용이 없어요'}]);
      const keys=Object.keys(rows[0]||{'안내':''});ws['!cols']=keys.map(k=>({wch:k==='구글 지도'?40:Math.min(40,Math.max(8,...rows.map(r=>String(r[k]??'').length),k.length)+2)}));
      XLSX.utils.book_append_sheet(wb,ws,n)}
    const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download=name+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }catch(e){ // 인터넷이 없으면 CSV(엑셀에서 열림)로 저장
    const rows=sheets[0][1].length?sheets[0][1]:sheets[1][1];const keys=Object.keys(rows[0]||{});
    const csv='\ufeff'+[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name+'.csv';document.body.append(a);a.click();a.remove();
    alert('오프라인이라 엑셀(.xlsx) 대신 CSV 파일로 저장했어요. 엑셀에서 바로 열 수 있어요.');
  }
}
function pdf(where){location.hash=where;setTimeout(()=>{alert('인쇄 창이 열리면 대상(프린터)을 “PDF로 저장”으로 바꿔서 저장하세요.');window.print()},150)}
function addButtons(){
  const ed=q('#jzPrint');if(ed&&!q('#jzExcel')){const b=document.createElement('button');b.className='btn dark';b.id='jzExcel';b.type='button';b.textContent='📊 엑셀 저장';ed.before(b);b.addEventListener('click',saveExcel);ed.textContent='📄 PDF 저장';}
  const pl=q('#copyPlan');if(pl&&!q('#jzExcel2')){const b=document.createElement('button');b.className='btn';b.id='jzExcel2';b.type='button';b.textContent='📊 엑셀 저장';pl.after(b);b.addEventListener('click',saveExcel);
    const pr=q('#print');if(pr){const c=pr.cloneNode(true);c.textContent='📄 PDF 저장';pr.replaceWith(c);c.addEventListener('click',()=>pdf('planner'))}}
}
addButtons();
const css=document.createElement('style');css.textContent='.jz-plan-source{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0;padding:10px 12px;border:1px solid #cfe0d4;border-radius:12px;background:#f5f9f5;font-size:13px}.jz-plan-source select{padding:7px 10px;border-radius:9px;border:1px solid #cdddcf;max-width:100%}.jz-route-link{margin-top:8px;display:inline-block;font-size:12px}@media print{.jz-plan-source,.jz-route-link{display:none!important}}';document.head.append(css);
renderSchedule();
})();
