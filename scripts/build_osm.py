#!/usr/bin/env python3
"""
JAPAN ZIP — OpenStreetMap 전국 음식점 데이터 빌드 스크립트 (무료, API 키 없음)

입력 (osmium-tool 로 미리 만든 GeoJSON Sequence 두 개):
  food.geojsonseq   음식점·카페·술집·마트·명소 (osmium export -a type,id)
  admin.geojsonseq  행정경계 admin_level 4(도도부현) / 7(시정촌) / 8(정령시의 구)
출력:
  data/osm/index.json        도도부현 목록·건수·범위
  data/osm/<slug>.json       도도부현별 가게 목록

GitHub Actions(.github/workflows/build-osm.yml)가 매월 자동 실행합니다.
데이터 © OpenStreetMap contributors, ODbL 1.0
"""
import argparse, datetime, json, math, os, re, subprocess, sys, collections, time, urllib.request, urllib.parse

import numpy as np
import shapely
from shapely.geometry import shape

PREFS = [  # (Korean name used by the app, Japanese name, file slug)
    ("홋카이도", "北海道", "hokkaido"), ("아오모리", "青森県", "aomori"), ("이와테", "岩手県", "iwate"),
    ("미야기", "宮城県", "miyagi"), ("아키타", "秋田県", "akita"), ("야마가타", "山形県", "yamagata"),
    ("후쿠시마", "福島県", "fukushima"), ("이바라키", "茨城県", "ibaraki"), ("도치기", "栃木県", "tochigi"),
    ("군마", "群馬県", "gunma"), ("사이타마", "埼玉県", "saitama"), ("지바", "千葉県", "chiba"),
    ("도쿄", "東京都", "tokyo"), ("가나가와", "神奈川県", "kanagawa"), ("니가타", "新潟県", "niigata"),
    ("도야마", "富山県", "toyama"), ("이시카와", "石川県", "ishikawa"), ("후쿠이", "福井県", "fukui"),
    ("야마나시", "山梨県", "yamanashi"), ("나가노", "長野県", "nagano"), ("기후", "岐阜県", "gifu"),
    ("시즈오카", "静岡県", "shizuoka"), ("아이치", "愛知県", "aichi"), ("미에", "三重県", "mie"),
    ("시가", "滋賀県", "shiga"), ("교토", "京都府", "kyoto"), ("오사카", "大阪府", "osaka"),
    ("효고", "兵庫県", "hyogo"), ("나라", "奈良県", "nara"), ("와카야마", "和歌山県", "wakayama"),
    ("돗토리", "鳥取県", "tottori"), ("시마네", "島根県", "shimane"), ("오카야마", "岡山県", "okayama"),
    ("히로시마", "広島県", "hiroshima"), ("야마구치", "山口県", "yamaguchi"), ("도쿠시마", "徳島県", "tokushima"),
    ("가가와", "香川県", "kagawa"), ("에히메", "愛媛県", "ehime"), ("고치", "高知県", "kochi"),
    ("후쿠오카", "福岡県", "fukuoka"), ("사가", "佐賀県", "saga"), ("나가사키", "長崎県", "nagasaki"),
    ("구마모토", "熊本県", "kumamoto"), ("오이타", "大分県", "oita"), ("미야자키", "宮崎県", "miyazaki"),
    ("가고시마", "鹿児島県", "kagoshima"), ("오키나와", "沖縄県", "okinawa"),
]
JP2PREF = {jp: (ko, jp, slug) for ko, jp, slug in PREFS}

LODGING = ('hotel', 'hostel', 'guest_house', 'motel', 'apartment')

# kind code -> rule. Order matters (first match wins).
def classify(t):
    a, sh, tour = t.get('amenity'), t.get('shop'), t.get('tourism')
    cuisine = (t.get('cuisine') or '').lower()
    if a == 'izakaya' or 'izakaya' in cuisine:
        return 'i'
    if a in ('restaurant', 'food_court'):
        return 'r'
    if a == 'fast_food':
        return 'f'
    if a in ('cafe', 'ice_cream'):
        return 'c'
    if a == 'bar':
        return 'b'
    if a in ('pub', 'biergarten'):
        return 'p'
    if sh in ('bakery', 'confectionery', 'pastry'):
        return 'k'
    if sh in ('supermarket', 'deli', 'seafood'):
        return 's'
    if sh == 'convenience':
        return 'v'
    if a == 'public_bath' or t.get('natural') == 'hot_spring':
        return 'o'
    if tour in ('museum', 'gallery'):
        return 'm'
    if t.get('historic') == 'castle':
        return 'h'
    if tour in ('attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'):
        return 'a'
    if tour in LODGING:
        return 'l'  # 숙소 (일정표 숙소 검색용, 별도 파일로 저장)
    return None


# ---------- 일본어 읽기(가나) → 한글 (외래어 표기법 기준, 어두 예사소리·어중 거센소리) ----------
_K = {}
def _row(chars, cons_init, cons_mid, vowels='aiueo'):
    for ch, v in zip(chars, vowels):
        if ch != '_':
            _K[ch] = (cons_init, cons_mid, v)
_row('あいうえお', 'ㅇ', 'ㅇ'); _row('かきくけこ', 'ㄱ', 'ㅋ'); _row('がぎぐげご', 'ㄱ', 'ㄱ')
_row('さしすせそ', 'ㅅ', 'ㅅ'); _row('ざじずぜぞ', 'ㅈ', 'ㅈ'); _row('たちつてと', 'ㄷ', 'ㅌ')
_row('だぢづでど', 'ㄷ', 'ㄷ'); _row('なにぬねの', 'ㄴ', 'ㄴ'); _row('はひふへほ', 'ㅎ', 'ㅎ')
_row('ばびぶべぼ', 'ㅂ', 'ㅂ'); _row('ぱぴぷぺぽ', 'ㅍ', 'ㅍ'); _row('まみむめも', 'ㅁ', 'ㅁ')
_K['や'] = ('ㅇ', 'ㅇ', 'ya'); _K['ゆ'] = ('ㅇ', 'ㅇ', 'yu'); _K['よ'] = ('ㅇ', 'ㅇ', 'yo'); _row('らりるれろ', 'ㄹ', 'ㄹ'); _K['わ'] = ('ㅇ', 'ㅇ', 'w'); _K['を'] = ('ㅇ', 'ㅇ', 'o')
_K['ち'] = ('ㅈ', 'ㅊ', 'i'); _K['つ'] = ('ㅆ', 'ㅆ', 'eu'); _K['ぢ'] = ('ㅈ', 'ㅈ', 'i'); _K['づ'] = ('ㅈ', 'ㅈ', 'eu')
_K['じ'] = ('ㅈ', 'ㅈ', 'i'); _K['ず'] = ('ㅈ', 'ㅈ', 'eu'); _K['す'] = ('ㅅ', 'ㅅ', 'eu')
_K['ゐ'] = ('ㅇ', 'ㅇ', 'i'); _K['ゑ'] = ('ㅇ', 'ㅇ', 'e')
for _sm, _v in zip('ぁぃぅぇぉ', 'aiueo'):
    _K[_sm] = ('ㅇ', 'ㅇ', _v)
_CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
_JUNG = {'a': 'ㅏ', 'i': 'ㅣ', 'u': 'ㅜ', 'e': 'ㅔ', 'o': 'ㅗ', 'ya': 'ㅑ', 'yu': 'ㅠ', 'yo': 'ㅛ', 'w': 'ㅘ', 'eu': 'ㅡ'}
_JUNGS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
_JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
def _syl(c, v, f=''):
    return chr(0xAC00 + (_CHO.index(c) * 21 + _JUNGS.index(_JUNG[v])) * 28 + _JONG.index(f))
def kana2ko(text, first=True):
    """ひらがな/カタカナ 읽기를 한글로. 장음(おう·うう·ー)은 표기하지 않음."""
    t = ''.join(chr(ord(ch) - 0x60) if 'ァ' <= ch <= 'ヶ' else ch for ch in (text or ''))
    t = t.replace('ゔ', 'ぶ').replace('ゕ', 'か').replace('ゖ', 'け')
    out = []  # [cho, vowel, final]
    i = 0
    while i < len(t):
        ch = t[i]; nx = t[i + 1] if i + 1 < len(t) else ''
        if ch in 'んン':
            if out: out[-1][2] = 'ㄴ'
            i += 1; continue
        if ch in 'っッ':
            if out: out[-1][2] = 'ㅅ'
            i += 1; continue
        if ch == 'ー':
            i += 1; continue
        if ch not in _K:
            return ''
        ci, cm, v = _K[ch]
        c = ci if (not out and first) else cm
        if nx and nx in 'ぁぃぅぇぉ':  # ファ·ティ·ウィ 같은 외래어
            v = {'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o'}[nx]
            if ch == 'ふ':
                c = 'ㅍ'
            if ch in 'てで':
                c = 'ㅌ' if ch == 'て' else 'ㄷ'
            out.append([c, v, '']); i += 2; continue
        if nx in 'ゃゅょ' and nx:
            v = {'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo'}[nx]
            if ch in 'じちぢ':
                v = v[1:]
            i += 1
        # 장음 생략: o/u 뒤의 う, o 뒤의 お
        if out and ch == 'う' and out[-1][1] in ('o', 'u', 'yo', 'yu'):
            i += 1; continue
        if out and ch == 'お' and out[-1][1] in ('o', 'yo'):
            i += 1; continue
        out.append([c, v, ''])
        i += 1
    try:
        return ''.join(_syl(c, v, f) for c, v, f in out)
    except Exception:
        return ''
# ---------- 가게 이름 한글 읽기 (SudachiPy 형태소 분석, 무료·오프라인) ----------
JP_RE = re.compile('[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\U00020000-\U0002ffff]')
HANGUL_RE = re.compile('[\uac00-\ud7a3]')
_TOK = None
def _tokenizer():
    global _TOK
    if _TOK is not None:
        return _TOK
    _TOK = False
    for attempt in (0, 1):
        try:
            from sudachipy import dictionary, tokenizer as T
            _TOK = (dictionary.Dictionary(dict='core').create(), T.Tokenizer.SplitMode.C)
            break
        except Exception as e:
            if attempt == 0:
                print('installing sudachipy for name readings…', flush=True)
                subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'sudachipy', 'sudachidict_core'], check=False)
                import importlib, site
                importlib.invalidate_caches()
                try:
                    sys.path.extend(p for p in site.getsitepackages() + [site.getusersitepackages()] if p not in sys.path)
                except Exception:
                    pass
            else:
                print('name readings disabled:', e, flush=True)
    return _TOK
_READ_CACHE = {}
def reading_ko(name, kana_hint=''):
    """日本語 가게 이름 → 한글 읽기 (예: 牛たん炭焼 利久 → 규탄스미야키 리큐). 실패하면 ''."""
    if not name or not JP_RE.search(name):
        return ''
    if kana_hint:
        r = kana2ko(re.sub(r'[\s・･]', '', kana_hint))
        if r:
            return r
    if name in _READ_CACHE:
        return _READ_CACHE[name]
    tk = _tokenizer()
    res = ''
    if tk:
        try:
            parts, run = [], []
            def flush():
                nonlocal run
                words, cur = [], []
                for rd in run + ['・']:
                    for seg in re.split('([・･])', rd):
                        if seg in ('・', '･'):
                            if cur: words.append(cur)
                            cur = []
                        elif seg:
                            cur.append(seg)
                for w in words:
                    k = ''.join(kana2ko(m, first=(j == 0)) or '\0' for j, m in enumerate(w))
                    if '\0' in k:
                        raise ValueError(w)
                    parts.append(k + ' ')
                run = []
            for m in tk[0].tokenize(name, tk[1]):
                sf = m.surface()
                if JP_RE.search(sf):
                    rd = m.reading_form()
                    if not rd or not re.fullmatch('[\u30a0-\u30ff]+', rd):
                        raise ValueError(sf)
                    run.append(rd)
                elif sf in '・･·':
                    flush(); parts.append(' ')
                else:
                    flush(); parts.append(sf)
            flush()
            res = re.sub(r'\s+', ' ', ''.join(parts)).strip()
        except Exception:
            res = ''
    _READ_CACHE[name] = res
    return res


_SUFFIX = [('区', ('く',), '구'), ('市', ('し',), '시'), ('町', ('まち', 'ちょう'), '정'), ('村', ('むら', 'そん'), '촌')]
def ko_name(p):
    """name:ko 가 없으면 가나 읽기로 한글 이름을 만든다 (예: 中央区 + ちゅうおうく → 주오구)."""
    if p.get('name:ko'):
        return p['name:ko']
    name = p.get('name') or ''
    kana = p.get('name:ja-Hira') or p.get('name:ja_kana') or p.get('name:ja-Kana') or ''
    if not kana:
        return ''
    kana = ''.join(chr(ord(ch) - 0x60) if 'ァ' <= ch <= 'ヶ' else ch for ch in kana)
    for kj, reads, ko in _SUFFIX:
        if name.endswith(kj):
            for rd in reads:
                if kana.endswith(rd):
                    base = kana2ko(kana[:-len(rd)])
                    return base + ko if base else ''
    return kana2ko(kana)


def read_seq(path):
    """osmium geojsonseq: one Feature per line, optionally prefixed by RS (0x1e)."""
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            line = line.strip().lstrip('\x1e').strip()
            if line:
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue


def load_admin(path):
    levels = {'4': [], '7': [], '8': []}
    for f in read_seq(path):
        p = f.get('properties') or {}
        lv = str(p.get('admin_level', ''))
        if lv not in levels or p.get('boundary') not in (None, 'administrative'):
            continue
        name = p.get('name') or p.get('name:ja')
        if not name or not f.get('geometry'):
            continue
        try:
            g = shape(f['geometry'])
            if not g.is_valid:
                g = shapely.make_valid(g)
        except Exception:
            continue
        if g.is_empty:
            continue
        levels[lv].append((g, {'name': name, 'ko': ko_name(p), 'en': p.get('name:en') or ''}))
    return levels


def assign(points, polys, nearest=False, max_dist=0.3):
    """Return, for each point, the index of the containing polygon (smallest one if several) or -1."""
    out = np.full(len(points), -1, dtype=np.int64)
    if not polys or not len(points):
        return out
    geoms = [g for g, _ in polys]
    areas = np.array([g.area for g in geoms])
    tree = shapely.STRtree(geoms)
    pi, gi = tree.query(points, predicate='within')
    # smallest polygon wins (handles nested/overlapping boundaries)
    order = np.lexsort((areas[gi], pi))[::-1]
    for k in order:
        out[pi[k]] = gi[k]
    if nearest:
        miss = np.where(out < 0)[0]
        if len(miss):
            mi, mg = tree.query_nearest(points[miss], max_distance=max_dist, return_distance=False, all_matches=False)
            out[miss[mi]] = mg
    return out


def wikidata_enrich(recs, batch=50):
    """관광지에 붙은 wikidata 태그로 한국어 이름·설명(없으면 일본어 설명)을 가져온다. 무료 공개 데이터, 키 불필요."""
    ids = sorted({r[13] for r in recs if r[13].startswith('Q') and r[3] in 'omha'})
    print('wikidata ids:', len(ids), flush=True)
    info = {}
    for i in range(0, len(ids), batch):
        chunk = ids[i:i + batch]
        url = 'https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({
            'action': 'wbgetentities', 'ids': '|'.join(chunk), 'props': 'labels|descriptions',
            'languages': 'ko|ja', 'format': 'json'})
        req = urllib.request.Request(url, headers={'User-Agent': 'JAPAN-ZIP-build/1.0 (static travel guide; monthly batch)'})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=40) as res:
                    data = json.load(res)
                break
            except Exception as e:
                data = None
                time.sleep(3 * (attempt + 1))
        if not data:
            print('  wikidata batch failed, skipping', i, flush=True)
            continue
        for q, ent in (data.get('entities') or {}).items():
            lab = (ent.get('labels') or {}).get('ko', {}).get('value', '')
            d = ent.get('descriptions') or {}
            info[q] = (lab, d.get('ko', {}).get('value', '') or d.get('ja', {}).get('value', ''))
        time.sleep(0.3)
    n = 0
    for r in recs:
        if r[13] in info:
            lab, desc = info[r[13]]
            if lab and not r[2] and lab != r[1]:
                r[2] = lab[:60]
            if desc and not r[11]:
                r[11] = desc[:120]
                n += 1
    print('wikidata descriptions added:', n, flush=True)


def short_url(u):
    if not u:
        return ''
    u = u.strip().split(';')[0]
    return u if u.startswith(('http://', 'https://')) and len(u) <= 160 else ''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--food', required=True)
    ap.add_argument('--admin', required=True)
    ap.add_argument('--out', default='data/osm')
    ap.add_argument('--built', default=datetime.date.today().isoformat())
    ap.add_argument('--no-wikidata', action='store_true', help='관광지 설명(위키데이터) 조회 생략')
    args = ap.parse_args()

    print('loading admin boundaries…', flush=True)
    adm = load_admin(args.admin)
    adm['4'] = [x for x in adm['4'] if x[1]['name'] in JP2PREF]
    print({k: len(v) for k, v in adm.items()}, flush=True)
    if len(adm['4']) < 40:
        print('WARNING: prefecture boundaries look incomplete', file=sys.stderr)

    print('reading places…', flush=True)
    recs, xs, ys = [], [], []
    seen = set()
    for f in read_seq(args.food):
        t = f.get('properties') or {}
        name = t.get('name') or t.get('name:ja')
        if not name:
            continue
        kind = classify(t)
        if not kind:
            continue
        geom = f.get('geometry')
        if not geom:
            continue
        try:
            if geom['type'] == 'Point':
                x, y = geom['coordinates'][:2]
            else:
                pt = shape(geom).representative_point()
                x, y = pt.x, pt.y
        except Exception:
            continue
        if not (122 <= x <= 154.5 and 20 <= y <= 46.5):
            continue
        oid = (t.get('@type') or 'node')[0] + str(t.get('@id', ''))
        if oid in seen:
            continue
        seen.add(oid)
        alt = t.get('name:ko') or t.get('name:en') or ''
        if alt == name:
            alt = ''
        recs.append([
            oid, name, alt, kind, (t.get('cuisine') or '').replace(' ', '')[:60],
            round(y, 5), round(x, 5),
            (t.get('opening_hours') or '')[:120],
            short_url(t.get('website') or t.get('contact:website') or t.get('url')),
            1 if (t.get('brand') or t.get('brand:wikidata')) else 0,
            (t.get('tourism') or t.get('historic') or t.get('bath:type') or '')[:20],
            (t.get('description:ko') or t.get('description:ja') or t.get('description') or '')[:120],
            (t.get('brand') or t.get('brand:ja') or '')[:40],
            (t.get('wikidata') or '').strip(),
            t.get('name:ja-Hira') or t.get('name:ja_kana') or t.get('name:ja-Kana') or '',
        ])
        if kind == 'l' and ('旅館' in name or t.get('guest_house') == 'ryokan' or t.get('hotel') == 'ryokan'):
            recs[-1][10] = 'ryokan'
        xs.append(x); ys.append(y)
    print('places with names:', len(recs), flush=True)
    if not args.no_wikidata:
        wikidata_enrich(recs)
    points = shapely.points(np.array(xs), np.array(ys))

    pref_idx = assign(points, adm['4'], nearest=True)
    city_idx = assign(points, adm['7'])
    ward_idx = assign(points, adm['8'])

    by_pref = collections.defaultdict(list)
    ward_ko = {}
    for i, r in enumerate(recs):
        if pref_idx[i] < 0:
            continue
        jp = adm['4'][pref_idx[i]][1]['name']
        city = adm['7'][city_idx[i]][1] if city_idx[i] >= 0 else None
        wd = adm['8'][ward_idx[i]][1] if ward_idx[i] >= 0 else None
        ward = wd['name'] if wd else ''
        if wd and wd['ko']:
            ward_ko[ward] = wd['ko']
        by_pref[jp].append((r, city, ward))

    os.makedirs(args.out, exist_ok=True)
    index = {'v': 1, 'built': args.built, 'license': 'ODbL 1.0', 'attribution': '© OpenStreetMap contributors',
             'fields': ['id', 'name', 'alt', 'kind', 'cuisine', 'lat', 'lon', 'city', 'ward', 'hours', 'web', 'chain', 'sub', 'desc', 'brand', 'ko'],
             'total': 0, 'prefs': {}}
    for ko, jp, slug in PREFS:
        rows = by_pref.get(jp, [])
        cities, cmap = [], {}
        out_rows, stay_rows = [], []
        for r, city, ward in sorted(rows, key=lambda z: (z[1]['name'] if z[1] else '~', z[0][1])):
            # ko: 한글 이름(name:ko·위키데이터) 또는 자동 읽기
            kr = r[2] if HANGUL_RE.search(r[2] or '') else reading_ko(r[1], r[14])
            if r[3] == 'l':
                # 숙소: id,name,ko,type,lat,lon,city(jp),city(ko),ward,web
                stay_rows.append([r[0], r[1], kr, r[10], r[5], r[6], city['name'] if city else '', city['ko'] if city else '', ward if ward != (city or {}).get('name') else '', r[8]])
                continue
            ci = -1
            if city:
                key = city['name']
                if key not in cmap:
                    cmap[key] = len(cities)
                    cities.append([key, city['ko'], 0])
                ci = cmap[key]
                cities[ci][2] += 1
            # id,name,alt,kind,cuisine,lat,lon,city,ward,hours,web,chain
            out_rows.append([r[0], r[1], r[2], r[3], r[4], r[5], r[6], ci, ward if ward != (city or {}).get('name') else '', r[7], r[8], r[9], r[10], r[11], r[12], kr])
        kinds = collections.Counter(r[3] for r in out_rows)
        lats = [r[5] for r in out_rows] or [0]
        lons = [r[6] for r in out_rows] or [0]
        doc = {'v': 1, 'pref': ko, 'jp': jp, 'built': args.built, 'attribution': index['attribution'],
               'cities': cities, 'wards': {w: ward_ko[w] for w in sorted({r[8] for r in out_rows if r[8]}) if w in ward_ko},
               'rows': out_rows}
        with open(os.path.join(args.out, slug + '.stay.json'), 'w', encoding='utf-8') as fh:
            json.dump({'v': 1, 'pref': ko, 'jp': jp, 'built': args.built, 'attribution': index['attribution'],
                       'fields': ['id', 'name', 'ko', 'type', 'lat', 'lon', 'city', 'cityKo', 'ward', 'web'], 'rows': stay_rows},
                      fh, ensure_ascii=False, separators=(',', ':'))
        path = os.path.join(args.out, slug + '.json')
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
        index['prefs'][slug] = {'ko': ko, 'jp': jp, 'count': len(out_rows), 'cities': len(cities),
                                'kinds': dict(kinds), 'bytes': os.path.getsize(path), 'stays': len(stay_rows),
                                'cityList': [[c[0], c[1], c[2]] for c in cities],
                                'bbox': [min(lats), min(lons), max(lats), max(lons)]}
        index['total'] += len(out_rows)
        print(f'{slug:10s} {len(out_rows):7d} rows {len(cities):4d} cities', flush=True)
    with open(os.path.join(args.out, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(',', ':'))
    print('total', index['total'])


if __name__ == '__main__':
    main()
