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
import argparse, datetime, json, math, os, sys, collections

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
    return None


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
        levels[lv].append((g, {'name': name, 'ko': p.get('name:ko') or '', 'en': p.get('name:en') or ''}))
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
        ])
        xs.append(x); ys.append(y)
    print('places with names:', len(recs), flush=True)
    points = shapely.points(np.array(xs), np.array(ys))

    pref_idx = assign(points, adm['4'], nearest=True)
    city_idx = assign(points, adm['7'])
    ward_idx = assign(points, adm['8'])

    by_pref = collections.defaultdict(list)
    for i, r in enumerate(recs):
        if pref_idx[i] < 0:
            continue
        jp = adm['4'][pref_idx[i]][1]['name']
        city = adm['7'][city_idx[i]][1] if city_idx[i] >= 0 else None
        ward = adm['8'][ward_idx[i]][1]['name'] if ward_idx[i] >= 0 else ''
        by_pref[jp].append((r, city, ward))

    os.makedirs(args.out, exist_ok=True)
    index = {'v': 1, 'built': args.built, 'license': 'ODbL 1.0', 'attribution': '© OpenStreetMap contributors',
             'fields': ['id', 'name', 'alt', 'kind', 'cuisine', 'lat', 'lon', 'city', 'ward', 'hours', 'web', 'chain'],
             'total': 0, 'prefs': {}}
    for ko, jp, slug in PREFS:
        rows = by_pref.get(jp, [])
        cities, cmap = [], {}
        out_rows = []
        for r, city, ward in sorted(rows, key=lambda z: (z[1]['name'] if z[1] else '~', z[0][1])):
            ci = -1
            if city:
                key = city['name']
                if key not in cmap:
                    cmap[key] = len(cities)
                    cities.append([key, city['ko'], 0])
                ci = cmap[key]
                cities[ci][2] += 1
            # id,name,alt,kind,cuisine,lat,lon,city,ward,hours,web,chain
            out_rows.append([r[0], r[1], r[2], r[3], r[4], r[5], r[6], ci, ward if ward != (city or {}).get('name') else '', r[7], r[8], r[9]])
        kinds = collections.Counter(r[3] for r in out_rows)
        lats = [r[5] for r in out_rows] or [0]
        lons = [r[6] for r in out_rows] or [0]
        doc = {'v': 1, 'pref': ko, 'jp': jp, 'built': args.built, 'attribution': index['attribution'],
               'cities': cities, 'rows': out_rows}
        path = os.path.join(args.out, slug + '.json')
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
        index['prefs'][slug] = {'ko': ko, 'jp': jp, 'count': len(out_rows), 'cities': len(cities),
                                'kinds': dict(kinds), 'bytes': os.path.getsize(path),
                                'cityList': [[c[0], c[1], c[2]] for c in cities],
                                'bbox': [min(lats), min(lons), max(lats), max(lons)]}
        index['total'] += len(out_rows)
        print(f'{slug:10s} {len(out_rows):7d} rows {len(cities):4d} cities', flush=True)
    with open(os.path.join(args.out, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(',', ':'))
    print('total', index['total'])


if __name__ == '__main__':
    main()
