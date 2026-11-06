/* JAPAN ZIP — 가게 대표메뉴·가격대 추정 + 관광명소 설명 + 추천 일정에 전체 가게 반영 + 엑셀·PDF 저장. 무료, API 키 없음 */
(()=>{
'use strict';
/* ---------- 이 가게는 뭘 파는 곳? (이름·장르 태그로 추정) ---------- */
// [키, 이름에 들어간 일본어, 한국어 이름, 설명, 최저가, 최고가]  가격 = 이런 종류 가게의 보통 1인 가격대 (추정)
const FOOD=[
 ['kaiten',/回転|スシロー|くら寿司|はま寿司|かっぱ寿司|魚べい|元気寿司/,'회전초밥','접시에 담긴 초밥을 골라 먹는 곳',1000,2500],
 ['indian',/インド|ネパール|タージ|ガネーシャ|ヒマラヤ|スパイス/,'인도·네팔 카레','난과 카레 세트 (점심 세트가 저렴)',900,1600],
 ['thai',/タイ料理|タイ食堂|ガパオ|ベトナム|フォー|バインミー|アジアン/,'동남아 요리','태국·베트남 요리 (팟타이·쌀국수)',1000,1800],
 ['gyutan',/牛タン|牛たん/,'우설(규탄)','우설 구이 정식',1800,3500],
 ['champon',/ちゃんぽん|皿うどん/,'짬뽕·사라우동','나가사키 짬뽕',800,1300],
 ['motsunabe',/もつ鍋|水炊き/,'모츠나베·미즈타키','곱창 전골·닭 전골 (2인 이상)',2000,4000],
 ['okisoba',/沖縄そば|ソーキそば|八重山そば/,'오키나와 소바','오키나와 소바·소키 소바',700,1200],
 ['soupcurry',/スープカレー/,'수프카레','삿포로식 수프카레',1200,2000],
 ['fugu',/ふぐ|河豚/,'복어 요리','복어 코스·복어회',5000,15000],
 ['crab',/かに|蟹|カニ/,'게 요리','게 코스·게 덮밥',3000,10000],
 ['oden',/おでん/,'오뎅','오뎅과 술',1500,3500],
 ['teppan',/鉄板焼/,'철판구이','철판 스테이크·해산물',3000,10000],
 ['onigiri',/おにぎり|おむすび|弁当/,'오니기리·도시락','주먹밥·도시락 (포장)',200,800],
 ['taiyaki',/たい焼|鯛焼|今川焼|大判焼/,'타이야키','붕어빵 간식',150,300],
 ['gelato',/ソフトクリーム|ジェラート|アイス/,'아이스크림','소프트아이스크림·젤라토',350,700],
 ['crepe',/クレープ/,'크레페','크레페 간식',500,900],
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
 ['snack',/スナック|ラウンジ/,'스낵바','마마상이 있는 작은 술집 (자릿세 별도)',3000,6000],
 ['bal',/バル|ワイン|ビストロ|ダイニング/,'다이닝바·와인바','와인·요리',3000,5000],
 ['kitchen',/キッチン|レストラン|グリル|洋風/,'레스토랑(양식)','양식 요리·런치 세트',1000,2500],
 ['washoku',/割烹|料亭|懐石|和食|御食事処|お食事処|食事処/,'일식당(와쇼쿠)','정식·회·생선구이 (고급 가게는 코스)',1200,5000],
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
 [/庭園|園$|苑$/,'🌿','정원','일본식 정원을 산책하며 경치를 보는 곳','무료~¥1,000'],
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
/* ---------- 주요 체인점 실제 대표메뉴·가격 (세금 포함, 매장 식사 기준, 공식·공개 자료로 확인) ---------- */
const CHAINS=[
// [이름 시작 글자(OSM name/brand), 한국어, 종류, [[메뉴,엔(,최대)]...], 확인 월, 출처]
[['吉野家','Yoshinoya'],'요시노야','규동',[['규동 보통',498],['규동 곱빼기',740],['규동 특곱빼기',938]],'2026-11','https://pricey.jp/web/articles/4515'],
[['すき家','Sukiya','SUKIYA'],'스키야','규동',[['규동 보통',480],['규동 곱빼기',680],['소갈비 덮밥 보통',780]],'2026-11','https://kumanichi.com/articles/2009856'],
[['松屋','Matsuya'],'마쓰야','규동·정식',[['규메시 보통',460],['로스카츠 정식',690],['소불고기 정식',890]],'2026-11','https://www.pricey.jp/web/articles/4516'],
[['なか卯','Nakau'],'나카우','오야코동·우동',[['오야코동 보통',480],['오야코동 소',390]],'2026-11','https://www.pricey.jp/web/articles/4637'],
[['やよい軒','Yayoiken','YAYOI'],'야요이켄','정식',[['생강구이 정식',890],['가라아게 정식',990],['치킨난반 정식',990]],'2026-11','https://www.pricey.jp/web/articles/4590'],
[['大戸屋','Ootoya','OOTOYA'],'오토야','정식',[['정식 대부분',950,1050]],'2024','https://www.ootoya.com/menu/'],
[['丸亀製麺','Marugame'],'마루가메 제면','사누키 우동',[['가마아게 우동 보통',390],['붓카케 우동(냉) 보통',440],['명란 가마타마 우동',640]],'2026-11','https://gourmet.watch.impress.co.jp/docs/news/2136655.html'],
[['はなまるうどん','Hanamaru Udon'],'하나마루 우동','사누키 우동',[['가케 우동 소',360],['온센타마고 붓카케 소',490],['기쓰네 우동 소',580]],'2026-11','https://www.pricey.jp/web/articles/4638'],
[['名代富士そば','富士そば','Fuji Soba','Fujisoba'],'후지소바','서서 먹는 소바',[['가케소바',450],['모리소바',450],['고로케 소바',610]],'2026-11','https://fujisoba.co.jp/menu/'],
[['ゆで太郎','Yudetaro'],'유데타로','소바',[['모리소바',430],['가케소바',430],['야채튀김 소바',550]],'2026-11','https://pricey.jp/web/articles/4775'],
[['かつや','Katsuya','KATSUYA'],'가츠야','돈카츠·가츠동',[['가츠동(기본)',682],['가츠동(중)',869],['로스카츠 정식',913]],'2026-11','https://pricey.jp/web/articles/4554'],
[['天丼てんや','てんや','Tenya','TENYA'],'텐야','텐동',[['원조 텐동',730],['올스타 텐동',860],['닭·잎새버섯 텐동',630]],'2026-11','https://www.j-cast.com/2026/10/29518784.html'],
[['一蘭','Ichiran','ICHIRAN'],'이치란','라멘',[['돈코츠 라멘',1080],['면 추가(카에다마)',210]],'2026-11','https://pricey.jp/web/articles/4683'],
[['一風堂','Ippudo','IPPUDO'],'잇푸도','라멘',[['시로마루 모토아지(돈코츠)',820],['아카마루 신아지(매운 미소 돈코츠)',920]],'2026-07','https://aumo.jp/articles/731308'],
[['天下一品','Tenkaippin','Tenka Ippin'],'텐카잇핀','라멘',[['콧테리 라멘(보통)',940],['앗사리 라멘(보통)',940]],'2026-02','https://pricey.jp/web/articles/4798'],
[['幸楽苑','Kourakuen','Korakuen'],'고라쿠엔','라멘',[['간장 라멘(주카소바)',490],['등지방 주카소바',590],['교자',280]],'2026-11','https://stores.kourakuen.co.jp/grandmenu'],
[['日高屋','熱烈中華食堂日高屋','Hidakaya'],'히다카야','중화·라멘',[['주카소바',420],['야채 듬뿍 탄멘',620],['교자 6개',300]],'2026-11','https://hidakaya.hiday.co.jp/'],
[['スガキヤ','寿がきや','Sugakiya','SUGAKIYA'],'스가키야','라멘',[['라멘',430],['고기 라멘',580],['소프트아이스크림',190]],'2026-11','https://www.sugakico.co.jp/menu/'],
[['魁力屋','ラーメン魁力屋','Kairikiya'],'카이리키야','라멘',[['간장 라멘(보통)',825],['구조파 등지방 간장 라멘',1089]],'2026-11','https://www.kairikiya.co.jp/menu/5'],
[['大阪王将','Osaka Ohsho','Osaka Osho'],'오사카오쇼','중화',[['원조 군만두 1인분',330]],'2025-04','https://yomuno.jp/posts/122998'],
[['餃子の王将','Gyoza no Ohsho'],'교자노오쇼','중화',[['교자 6개',363],['볶음밥',693],['덴신항',737]],'2026-11','https://www.ohsho.co.jp/menu/east/'],
[['バーミヤン','Bamiyan'],'바미얀','중화 패밀리 레스토랑',[['바미얀 라멘',714],['볶음밥(수프바 포함)',659]],'2026-11','https://www.pricey.jp/web/articles/4943'],
[['CoCo壱番屋','カレーハウスCoCo壱番屋','ココイチ','CoCo Ichibanya'],'코코이찌방야','카레',[['포크 카레',646],['로스카츠 카레',1055],['수제 돈카츠 카레',1319]],'2026-11','https://www.ichibanya.co.jp/menu/list.html?cid=1'],
[['ゴーゴーカレー','Go Go Curry','GoGoCurry'],'고고카레','카레',[['로스카츠 카레(중)',950],['메이저 카레(중)',1700]],'2026-05','https://www.pricey.jp/web/articles/4711'],
[['スシロー','あきんどスシロー','Sushiro'],'스시로','회전초밥',[['최저가 접시(연어·오징어 등)',120,150],['엄선 참치 아카미',150]],'2026-11','https://pricey.jp/web/articles/4518'],
[['くら寿司','無添くら寿司','Kura Sushi'],'쿠라스시','회전초밥',[['최저가 접시',110],['숙성 참치',120],['연어',120]],'2026-11','https://www.hokkaido-np.co.jp/article/1355650/'],
[['はま寿司','Hama Sushi','Hamazushi'],'하마스시','회전초밥',[['최저가 접시(참치 등)',110],['참치 주토로',176],['성게 군함말이',319]],'2026-11','https://www.hamazushi.com/topics/2026/0316000788.html'],
[['かっぱ寿司','Kappa Sushi','Kappazushi'],'갓파스시','회전초밥',[['최저가 접시',110],['주토로·단새우 등',165]],'2026-11','https://pricey.jp/web/articles/4635'],
[['サイゼリヤ','Saizeriya'],'사이제리야','이탈리안 패밀리 레스토랑',[['밀라노풍 도리아',300],['매운 치킨',300],['페페론치노',300]],'2026-10','https://ichioshi.allabout.co.jp/articles/limited/35025'],
[['ガスト','Gusto'],'가스토','패밀리 레스토랑',[['치즈 인 함바그',714,824],['치즈 온 치즈 인 함바그',989]],'2026-04','https://yomuno.jp/posts/137053'],
[['デニーズ',"Denny's",'Dennys'],'데니스','패밀리 레스토랑',[['일본풍 함바그',880],['무즙 함바그',990],['소고기 함바그 스테이크',1518]],'2026-11','https://www.dennys.jp/menu/hamburg/'],
[['ジョナサン',"Jonathan's"],'조나단','패밀리 레스토랑',[['감자튀김',329],['드링크바(세트)',296,439]],'2026-10','https://report.iko-yo.net/articles/34393'],
[['ココス',"COCO'S","Coco's"],'코코스','패밀리 레스토랑',[['코코스 함바그',869],['6종 치즈 호일구이 함바그',1309]],'2026-11','https://www.cocos-jpn.co.jp/menu/'],
[['ロイヤルホスト','Royal Host'],'로열호스트','고급 패밀리 레스토랑',[['카시미르 비프카레',1793],['흑×흑 함바그',1628],['로열 오므라이스',1243]],'2026-11','https://www.royalhost.jp/menu/'],
[['びっくりドンキー','Bikkuri Donkey'],'빗쿠리동키','함바그 레스토랑',[['레귤러 버그 디시 150g',930,1020],['치즈 버그 디시 150g',1130]],'2026-10','https://pricey.jp/web/articles/4642'],
[['ジョイフル','Joyfull'],'조이풀','저가 패밀리 레스토랑',[['일일 원코인 런치',500],['페퍼 함바그',702],['치즈 함바그',735]],'2026-05','https://pricey.jp/web/articles/4935'],
[['マクドナルド',"McDonald's",'McDonalds'],'맥도날드','햄버거',[['빅맥',500],['데리야키 맥버거',400],['치즈버거',240]],'2026-11','https://www.mcdonalds.co.jp/menu/burger/'],
[['モスバーガー','MOS BURGER','Mos Burger'],'모스버거','햄버거',[['모스버거',500],['데리야키버거',490]],'2026-10','https://www.pricey.jp/web/articles/4524'],
[['ゼッテリア','ロッテリア','ZETTERIA','LOTTERIA','Lotteria'],'젯테리아(구 롯데리아)','햄버거',[['절품 비프버거',540]],'2026-04','https://news.mynavi.jp/article/20260413-4330358/'],
[['ケンタッキー','KFC','Kentucky'],'KFC','치킨',[['오리지널 치킨 1조각',330],['일본풍 치킨카츠버거',490]],'2026-11','https://www.kfc.co.jp/menu/'],
[['バーガーキング','Burger King','BURGER KING'],'버거킹','햄버거',[['와퍼 치즈',740],['스파이시 와퍼 주니어',480]],'2026-06','https://www.burgerking.co.jp/'],
[['フレッシュネスバーガー','Freshness Burger','FRESHNESS BURGER'],'프레시니스버거','햄버거',[['프레시니스버거',560],['클래식버거',690],['클래식 치즈버거',780]],'2026-11','https://www.freshnessburger.co.jp/menu/hamburger'],
[['焼肉きんぐ','Yakiniku King'],'야키니쿠 킹','야키니쿠 무한리필',[['58품 코스(성인)',3278]],'2026-05','https://ichioshi.allabout.co.jp/articles/common/501285'],
[['牛角','Gyu-Kaku','Gyukaku','GYU-KAKU'],'규카쿠','야키니쿠',[['무한리필 50품 코스',3058],['70품 이상 코스',3718]],'2026-10','https://pricey.jp/web/articles/4969'],
[['焼肉ライク','Yakiniku Like','YAKINIKU LIKE'],'야키니쿠 라이크','1인 야키니쿠',[['갈비+닭가슴살 세트',690]],'2026-05','https://weekly.ascii.jp/elem/000/004/400/4400096/'],
[['鳥貴族','Torikizoku','TORIKIZOKU'],'도리키조쿠','야키토리 이자카야',[['전 메뉴 균일가',410],['닭다리 꼬치(모모 키조쿠야키)',410]],'2026-11','https://www.pricey.jp/web/articles/4494'],
[['磯丸水産','Isomaru'],'이소마루 수산','해산물 이자카야',[['게미소 등딱지구이',499,549],['해산물 넘치는 덮밥',980,1078]],'2026-08','https://ranking.net/rankings/best-isomaru-menu'],
[['串カツ田中','Kushikatsu Tanaka'],'쿠시카츠 다나카','쿠시카츠 이자카야',[['돼지 쿠시카츠',198],['소고기 쿠시카츠',209],['기본 5개 모둠',924]],'2026-11','https://kushi-tanaka.com/menu/items/menu_kushikatsu'],
[['いきなり!ステーキ','いきなりステーキ','いきなり！ステーキ','Ikinari Steak'],'이키나리 스테이크','스테이크',[['와일드 스테이크 300g',2920],['특선 안심 200g',3770],['립로스 300g',4410]],'2026-11','https://ikinaristeak.com/menu/'],
[['スターバックス','Starbucks'],'스타벅스','카페',[['스타벅스 라떼(톨)',515,535]],'2026-11','https://kumanichi.com/articles/2037459'],
[['ドトール','Doutor'],'도토루','카페',[['블렌드 커피(S)',300],['카페라떼(S)',400],['밀라노 샌드 A',520]],'2026-11','https://pricey.jp/web/articles/4748'],
[['タリーズ',"Tully's",'Tullys'],'털리스','카페',[['오늘의 커피(톨)',450],['카페라떼(톨)',510],['볼파크 도그',410]],'2026-11','https://gourmet.watch.impress.co.jp/docs/news/2035035.html'],
[['コメダ','Komeda'],'코메다 커피','카페',[['코메다 블렌드',460,700],['시로누아르',740,800],['미니 시로누아르',540,600]],'2026-11','https://ichioshi.allabout.co.jp/articles/limited/32461'],
[['サンマルク','Saint Marc','St.Marc'],'생마르크 카페','카페',[['블렌드 커피(S)',350],['카페라떼(S)',450],['초코크로',250]],'2026-11','https://www.saint-marc-hd.com/saintmarccafe/menu/'],
[['エクセルシオール','Excelsior'],'엑셀시오르 카페','카페',[['블렌드 커피(R)',390],['카페라떼(R)',500]],'2026-11','https://www.doutor.co.jp/exc/menu/'],
[['星乃珈琲'],'호시노 커피','카페',[['호시노 블렌드',450,580],['수플레 팬케이크(싱글)',580],['수플레 팬케이크(더블)',780]],'2025-06','https://macaro-ni.jp/150192'],
[['上島珈琲','Ueshima'],'우에시마 커피','카페',[['흑당 밀크커피(R)',690]],'2026-11','https://www.ueshima-coffee-ten.jp/menu/'],
[['ミスタードーナツ','ミスド','Mister Donut'],'미스터도넛','도넛',[['폰데링',187],['올드패션',187],['블렌드 커피',297]],'2026-11','https://www.misterdonut.jp/m_menu/donut/'],
[['珈琲館','Kohikan'],'코히칸','카페',[['코히칸 블렌드',590,850],['숯불 커피',650,910],['핫케이크',850,1110]],'2026-11','https://c-united.co.jp/coffeekan/products/coffee/'],
[['カフェ・ベローチェ','ベローチェ','Veloce'],'카페 벨로체','카페',[['블렌드 커피(R)',350,450],['카페라떼(R)',430,530],['커피젤리',480]],'2026-11','https://c-united.co.jp/veloce/products/hotdrink/'],
[['サーティワン','31アイスクリーム','Baskin'],'배스킨라빈스(31)','아이스크림',[['레귤러 싱글',420],['스몰 더블',510],['키즈',340]],'2026-11','https://www.pricey.jp/web/articles/4828'],
];
function chainOf(r){
  const name=String(r[1]||'').trim(),brand=String(r[14]||'').trim(),ln=name.toLowerCase(),lb=brand.toLowerCase();
  return CHAINS.find(c=>c[0].some(m=>{const lm=m.toLowerCase();return ln.startsWith(lm)||(lb&&(lb===lm||lb.startsWith(lm)))}));
}
function jzGuess(r){
  const name=String(r[1]||'')+' '+String(r[2]||''),k=r[3],tags=String(r[4]||'').toLowerCase().split(';').map(x=>x.trim()),sub=r[12]||'',desc=r[13]||'';
  if('omha'.includes(k)){
    let s=SPOT.find(x=>x[0].test(r[1]||''));
    if(s)return {spot:true,icon:s[1],label:s[2],what:s[3],price:s[4],desc};
    const t=SUB_SPOT[sub]||SPOT_KIND[k];
    if(t)return {spot:true,icon:t[0],label:t[1],what:t[2],price:t[3],desc};
    if(desc)return {spot:true,icon:'📍',label:'관광명소',what:desc,price:'',desc:''};
    return {spot:true,icon:'📍',label:'관광명소',what:'무엇을 하는 곳인지는 📷 사진·지도에서 확인',price:'',desc};
  }
  const ch=chainOf(r);
  if(ch){const ys=ch[3].flatMap(i=>i.slice(1).filter(Boolean));return {spot:false,chain:true,key:'chain',ctype:ch[2],label:ch[1],what:ch[2]+' 체인',items:ch[3],checked:ch[4],source:ch[5],lo:Math.min(...ys),hi:Math.max(...ys),price:ys.length?yen(Math.min(...ys))+'~'+yen(Math.max(...ys)):'',desc}}
  let f=FOOD.find(x=>x[1].test(name));let src='name';
  if(!f){for(const t of tags){const key=TAG[t];if(key){f=FOOD.find(x=>x[0]===key);src='tag';break}}}
  if(!f&&KINDFOOD[k]){f=FOOD.find(x=>x[0]===KINDFOOD[k]);src='kind'}
  if(f)return {spot:false,key:f[0],label:f[2],what:f[3],lo:f[4],hi:f[5],price:'보통 1인 '+yen(f[4])+'~'+yen(f[5]),src,desc};
  const o=OTHER[k]||OTHER.r;
  return {spot:false,label:o[0],what:o[1],lo:o[2],hi:o[3],price:o[2]?'보통 '+yen(o[2])+'~'+yen(o[3]):'',src:'kind',desc};
}
const escH=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function jzMenuLine(r,place){
  const g=jzGuess(r);
  const photo='https://www.google.com/search?tbm=isch&q='+encodeURIComponent((r[1]||'')+' '+(place||'')+(g.spot?'':' メニュー'));
  if(g.chain){
    const items=g.items.map(i=>`<li>${escH(i[0])} <b>${i[1]?yen(i[1])+(i[2]?'~'+yen(i[2]):''):'가격 확인 필요'}</b></li>`).join('');
    return `<div class="jz-menu-line jz-chain">🍽️ <b>${escH(g.label)}</b> · ${escH(g.what)}<ul class="jz-items">${items}</ul><div class="jz-price-note">✓ 실제 가격(세금 포함·매장 식사) · ${escH(g.checked)} 확인 · 매장·지역별 차이 가능 <a target="_blank" rel="noopener noreferrer" href="${escH(g.source)}">출처↗</a></div><a class="jz-photo" target="_blank" rel="noopener noreferrer" href="${photo}">📷 메뉴 사진 보기 ↗</a></div>`;
  }
  const head=g.spot?`${g.icon} <b>${escH(g.label)}</b> — ${escH(g.what)}`:`🍽️ <b>${escH(g.label)}</b> — ${escH(g.what)}`;
  return `<div class="jz-menu-line">${head}${g.price?`<div class="jz-price">💴 ${escH(g.price)} <small>(이런 ${g.spot?'곳':'가게'}의 일반적인 가격대 · 추정)</small></div>`:''}${g.desc?`<div class="jz-odesc">“${escH(g.desc)}”</div>`:''}<a class="jz-photo" target="_blank" rel="noopener noreferrer" href="${photo}">📷 ${g.spot?'사진':'메뉴 사진'} 보기 ↗</a></div>`;
}
window.jzGuess=jzGuess;window.jzMenuLine=jzMenuLine;
/* ---------- 🍽️ 뭐 먹을까? 음식 분류 12개 (가게 종류 기준 · 추정) ---------- */
// [키, 이름, 가게 종류 키들, 체인 종류/텍스트 정규식, 이 분류에 넣는 OSM kind]
const FOODCATS=[
 ['beef','🥩 소고기',['yakiniku','gyudon','steak','gyutan','shabu','teppan'],/소고기|규동|규메시|야키니쿠|스테이크|우설|규탄|함바그|햄버그|와규|스키야키|샤부샤부|焼肉|牛|すき焼|精肉|肉料理/,[]],
 ['pork','🐷 돼지고기',['tonkatsu','kushikatsu','okisoba'],/돼지|돈카츠|가츠동|쿠시카츠|생강구이|豚|とんかつ/,[]],
 ['chicken','🍗 닭고기',['yakitori','motsunabe'],/닭|야키토리|가라아게|치킨|오야코동|미즈타키|焼鳥|焼き鳥|鶏/,[]],
 ['sea','🐟 회·초밥·해산물',['sushi','kaiten','seafood','unagi','fugu','crab'],/초밥|스시|회전초밥|생선회|모둠회|회덮밥|사시미|해산물|생선|장어|대게|털게|게살|게 요리|굴|카이센|고마사바|寿司|鮨|海鮮|うなぎ|鰻|鮎|蒲鉾|しらす|魚|あんこう|海産/,[]],
 ['noodle','🍜 면',['ramen','udon','soba','champon','okisoba'],/라멘|우동|소바|짬뽕|츠케멘|탄멘|냉면|소면|ラーメン|うどん|そば|蕎麦|麺/,[]],
 ['rice','🍚 밥·정식·덮밥',['teishoku','washoku','gyudon','tempura','onigiri','tonkatsu'],/정식|덮밥|규동|텐동|가츠동|오야코동|밥|오니기리|도시락|定食|料亭|料理屋|京料理|懐石|割烹|精進|会席|料理旅館|日本料理|有職|仕出し|弁当|湯豆腐|豆富料理/,[]],
 ['curry','🍛 카레',['curry','soupcurry','indian'],/카레|カレー/,[]],
 ['asian','🥟 중화·한식·아시아',['chinese','korean','thai','champon'],/중화|중식|교자|만두|한식|태국|베트남|쌀국수|中華|中国|餃子/,[]],
 ['western','🍝 양식',['italian','pizza','french','yoshoku','famires','burger','steak','kitchen','bal'],/양식|이탈리안|파스타|피자|프렌치|오므라이스|함바그|햄버거|버거|패밀리|도리아|イタリア|フランス|洋食/,[]],
 ['teppan','🍢 철판·길거리 간식',['okonomi','takoyaki','taiyaki','crepe'],/오코노미|타코야키|몬자|타이야키|크레페|お好み|たこ焼/,[]],
 ['drink','🍺 술·안주',['izakaya','yakitori','oden','bar','snack','bal','kushikatsu'],/술집|술과|이자카야|사케|타치노미|와인|야키토리|居酒屋|焼鳥|酒造|焼酎|おでん/,['i','b','p']],
 ['sweet','☕ 카페·디저트',['cafe','kissa','starbucks','bakery','sweets','gelato','crepe','taiyaki'],/카페|커피|디저트|빵|케이크|화과자|킷사|도넛|아이스크림|パン|カフェ|喫茶|スイーツ|和菓子|菓子|甘味|茶屋|茶房|団子|餅|煎餅|八ツ橋|羊羹|フルーツ/,['c','k']],
];
function jzFoodCats(r){
  if(r._fc)return r._fc;
  const g=jzGuess(r);const out=new Set();
  if(!g.spot){for(const c of FOODCATS){if((g.key&&c[2].includes(g.key))||(g.chain&&c[3].test(g.ctype+' '+g.items.map(i=>i[0]).join(' ')))||c[4].includes(r[3]))out.add(c[0])}}
  r._fc=out;return out;
}
function jzFoodCatsText(text){const out=new Set();for(const c of FOODCATS)if(c[3].test(text))out.add(c[0]);return out}
window.JZ_FOODCATS=FOODCATS.map(c=>[c[0],c[1]]);window.jzFoodCats=jzFoodCats;window.jzFoodCatsText=jzFoodCatsText;

/* ---------- 🍱 지역 먹거리: 문화청 「100年フード」 표시 ---------- */
(function hyakunenFood(){
  const cards=document.getElementById('foodCards');if(!cards)return;
  const PJ=typeof JAPAN_PREF_JP!=='undefined'?JAPAN_PREF_JP:{};const KO_BY_JP=Object.fromEntries(Object.entries(PJ).map(([k,v])=>[v,k]));
  const CAT={'伝統':['전통','에도 시대부터 이어진 음식'],'近代':['근대','메이지~쇼와 초에 생긴 음식'],'未来':['미래','앞으로 100년 이어갈 음식']};
  const n=x=>String(x||'').normalize('NFKC').replace(/[\s・･·（）()「」〜～\-]/g,'').toLowerCase();
  let HF=null;
  const panel=document.createElement('section');panel.className='hf-panel';panel.id='hfPanel';cards.after(panel);
  const regSel=document.getElementById('foodRegion'),prefSel=document.getElementById('foodPref');
  function itemsFor(prefKo,regionKo){if(!HF)return [];return HF.filter(it=>{const ps=it.prefs;if(prefKo)return ps.includes(prefKo);if(regionKo&&typeof JAPAN_REGIONS!=='undefined')return ps.some(p=>(JAPAN_REGIONS[regionKo]||[]).includes(p));return true})}
  function renderPanel(){
    if(!HF){panel.innerHTML='';return}
    const pk=prefSel?.value||'',rk=regSel?.value||'';const list=itemsFor(pk,rk);
    const where=pk||rk||'일본 전국';
    panel.innerHTML=`<details ${pk?'open':''}><summary>🏮 문화청 「100年フード」 인증 음식 · ${escH(where)} (${list.length})</summary><p class="tiny">일본 문화청이 100년 넘게(또는 앞으로 100년) 이어갈 지역 음식 문화로 인증한 음식이에요. 가게 인증이 아니라 음식 인증이에요. <a href="${escH(HF_URL)}" target="_blank" rel="noopener noreferrer">공식 목록 ↗</a></p>
      <div class="hf-list">${list.slice(0,pk?200:60).map(it=>{const c=CAT[it.cat]||[it.cat,''];const q=it.name.replace(/[（(].*?[)）]/g,'').replace(/[～〜].*$/,'')+' '+it.prefJp;
        return `<div class="hf-item"><div><span class="hf-cat hf-${escH(it.cat)}">🏮 ${escH(c[0])}의 100년 푸드 · ${escH(it.year)}</span><b>${escH(it.name)}</b><small>${escH(it.prefs.join('·'))}</small><p>${escH(it.ko)}</p></div><div class="hf-links"><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}">📍 파는 곳 찾기 ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}">📷 사진 ↗</a></div></div>`}).join('')}${!pk&&list.length>60?'<p class="tiny">도도부현을 고르면 그 지역 인증 음식이 모두 보여요.</p>':''}</div></details>`;
  }
  let HF_URL='https://www.bunka.go.jp/seisaku/shokubunka/foodculture/hyakunenfood/';
  function decorate(){
    if(!HF)return;
    for(const card of cards.querySelectorAll('.food-item')){
      if(card.dataset.hf)continue;card.dataset.hf='1';
      const pref=(card.querySelector('.food-tag')?.textContent||'').split('·').pop().trim();
      const jp=n(card.querySelector('.jp')?.textContent),ko=n(card.querySelector('h3')?.textContent);
      const hit=HF.find(it=>it.prefs.includes(pref)&&jp.length>=2&&it.parts.some(p=>p===jp||(jp.length>=3&&p.length>=3&&(p.includes(jp)||jp.includes(p)))));
      if(hit){const c=CAT[hit.cat]||[hit.cat,''];const b=document.createElement('span');b.className='hf-badge';b.title=c[1];b.textContent='🏮 문화청 100년 푸드 ('+c[0]+' · '+hit.year+' 인증)';card.querySelector('h3')?.before(b)}
    }
  }
  fetch('data/hyakunen_food.json').then(r=>r.ok?r.json():null).then(d=>{if(!d)return;HF_URL=d.url||HF_URL;
    HF=d.items.map(([name,prefJp,cat,year,ko])=>{const prefs=String(prefJp).split('・').map(p=>KO_BY_JP[p]||p);
      const inner=(name.match(/[（(～〜](.*?)[)）～〜]/)||[])[1]||'';
      const parts=[name,name.replace(/[（(].*?[)）]/g,''),...inner.split(/[、,]/)].map(n).filter(Boolean);
      return {name,prefJp,prefs,cat,year,ko,parts}});
    decorate();renderPanel()}).catch(()=>{});
  new MutationObserver(decorate).observe(cards,{childList:true});
  regSel?.addEventListener('change',()=>setTimeout(renderPanel,0));prefSel?.addEventListener('change',()=>setTimeout(renderPanel,0));
  document.getElementById('foodClear')?.addEventListener('click',()=>setTimeout(renderPanel,0));
  const st=document.createElement('style');st.textContent='.hf-badge{display:inline-block;font-size:11px;font-weight:800;color:#8a3b12;background:#ffeede;border:1px solid #f3c9a6;border-radius:20px;padding:3px 9px;margin:4px 0}.hf-panel{margin-top:18px}.hf-panel>details{border:1px solid #f0d4bd;border-radius:16px;background:#fffaf5;padding:12px 14px}.hf-panel summary{cursor:pointer;font-weight:800;font-size:16px;color:#7a3a14}.hf-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:10px}.hf-item{display:flex;flex-direction:column;justify-content:space-between;gap:8px;background:#fff;border:1px solid #f1e2d4;border-radius:12px;padding:10px 12px}.hf-item b{display:block;font-size:15px}.hf-item small{color:#8a7a6a}.hf-item p{margin:4px 0 0;font-size:13px;color:#4e4a44}.hf-cat{display:inline-block;font-size:11px;font-weight:800;border-radius:20px;padding:2px 8px;margin-bottom:4px;background:#ffeede;color:#8a3b12}.hf-近代{background:#e8eefc;color:#2b4f9a}.hf-未来{background:#e6f5ec;color:#1d6b40}.hf-links{display:flex;gap:10px;font-size:12px;font-weight:700}.hf-links a{color:var(--blue,#375f93)}';document.head.append(st);
})();
{const css=document.createElement('style');css.textContent='.jz-menu-line{font-size:13px;color:#2f4a40;background:#f7faf6;border-radius:10px;padding:8px 10px;line-height:1.55}.jz-price{color:#8a6a2a;font-weight:700;font-size:12px}.jz-price small{font-weight:500;color:#9a8a6a}.jz-odesc{font-size:12px;color:#5b6b64;margin-top:2px}.jz-photo{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;color:var(--blue,#375f93)}.jz-chain{background:#fff8ec;border:1px solid #f0dcb4}.jz-items{margin:4px 0 2px;padding-left:18px}.jz-items b{color:#8a5a12}.jz-price-note{font-size:11px;color:#6b7a73}.jz-price-note a{text-decoration:underline}';document.head.append(css)}

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
    menu:(()=>{const g=jzGuess(r);return g.chain?g.label+' — '+g.items.filter(i=>i[1]).slice(0,2).map(i=>i[0]+' '+yen(i[1])).join(', ')+' (실제 가격)':g.label+' — '+g.what+' (📋 전체 가게)'})(),
    price:(d!=null?'이전 장소에서 약 '+(d<1?Math.round(d*1000)+'m':d.toFixed(1)+'km')+' · ':'')+(jzGuess(r).price||'가격은 지도에서 확인')+(jzGuess(r).price?(jzGuess(r).chain?' (실제 가격)':' (추정)'):''),
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
