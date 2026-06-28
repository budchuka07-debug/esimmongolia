/**
 * Extra location chunk — load via LOCATION_ENGINE.loadChunk (scalable to 100k+).
 * Add /data/locations/*.json chunks without changing UI code.
 */
(function (root) {
  const EXTRA_LINES = `
wuxi|china|Wuxi|Wuxi|无锡|WUX||
xuzhou|china|Xuzhou|Xuzhou|徐州|XUZ||
yantai|china|Yantai|Yantai|烟台|YNT||
weihai|china|Weihai|Weihai|威海|WEH||
zhongshan|china|Zhongshan|Zhongshan|中山|ZGN||
huizhou|china|Huizhou|Huizhou|惠州|HUZ||
jiangmen|china|Jiangmen|Jiangmen|江门|||
shaoxing|china|Shaoxing|Shaoxing|绍兴|||
jinhua|china|Jinhua|Jinhua|金华|YIW||
taizhou_zj|china|Taizhou|Taizhou|台州|HYN||
linyi|china|Linyi|Linyi|临沂|||
weifang|china|Weifang|Weifang|潍坊|||
luoyang|china|Luoyang|Luoyang|洛阳|||
nanyang|china|Nanyang|Nanyang|南阳|||
xuzhou|china|Xuzhou|Xuzhou|徐州|XUZ||
baotou|china|Baotou|Baotou|包头|BAV||
ordos|china|Ordos|Ordos|鄂尔多斯|DSN||
lijiang|china|Lijiang|Lijiang|丽江|LJG||
dali|china|Dali|Dali|大理|DLU||
xishuangbanna|china|Xishuangbanna|Xishuangbanna|西双版纳|JHG||
guilin|china|Guilin|Guilin|桂林|KWL||
yangshuo|china|Yangshuo|Yangshuo|阳朔|||
liuzhou|china|Liuzhou|Liuzhou|柳州|LZH||
zhuhai_macau|china|Zhuhai|Zhuhai|珠海|ZUH||
urumqi|china|Urumqi|Urumqi|乌鲁木齐|URC||
kashgar|china|Kashgar|Kashgar|喀什|KHG||
lhasa|china|Lhasa|Lhasa|拉萨|LXA||
xining|china|Xining|Xining|西宁|XNN||
lanzhou|china|Lanzhou|Lanzhou|兰州|LHW||
yinchuan|china|Yinchuan|Yinchuan|银川|INC||
hohhot|china|Хөх хот|Hohhot|呼和浩特|HET|Huhehaote
yinchuan|china|Yinchuan|Yinchuan|银川|INC||
tianjin|china|Тяньжин|Tianjin|天津|TSN||
beijing|china|Бээжин|Beijing|北京|PEK,PKX|Peking
shanghai|china|Шанхай|Shanghai|上海|PVG,SHA||
guangzhou|china|Гуанжоу|Guangzhou|广州|CAN||
shenzhen|china|Шэньжэнь|Shenzhen|深圳|SZX||
chengdu|china|Чэнду|Chengdu|成都|CTU||
xian|china|Сиань|Xi'an|西安|XIY||
harbin|china|Харбин|Harbin|哈尔滨|HRB||
yiwu|china|Иү|Yiwu|义乌|YIW||
phuket_town|thailand|Phuket Town|Phuket Town|Phuket|||
koh_phangan|thailand|Koh Phangan|Koh Phangan|Koh Phangan|||
koh_tao|thailand|Koh Tao|Koh Tao|Koh Tao|||
ayutthaya|thailand|Ayutthaya|Ayutthaya|Ayutthaya|||
sukhothai|thailand|Sukhothai|Sukhothai|Sukhothai|||
da_lat|vietnam|Da Lat|Da Lat|Đà Lạt|DLI||
hue|vietnam|Hue|Hue|Huế|HUI||
sapa|vietnam|Sapa|Sapa|Sa Pa|||
halong|vietnam|Ha Long|Ha Long|Hạ Long|||
fukuoka_jp|japan|Fukuoka|Fukuoka|福岡|FUK||
nara|japan|Nara|Nara|奈良|||
kanazawa|japan|Kanazawa|Kanazawa|金沢|KMQ||
sendai|japan|Sendai|Sendai|仙台|SDJ||
busan_kr|korea|Busan|Busan|부산|PUS||
gyeongju|korea|Gyeongju|Gyeongju|경주|||
jeonju|korea|Jeonju|Jeonju|전주|||
porto_pt|portugal|Porto|Porto|Porto|OPO||
seville_es|spain|Seville|Seville|Sevilla|SVQ||
porto_es|spain|Porto|Porto|Porto|||
munich_de|germany|Munich|Munich|München|MUC||
zurich_ch|switzerland|Zurich|Zurich|Zürich|ZRH||
interlaken|switzerland|Interlaken|Interlaken|Interlaken|||
salzburg|austria|Salzburg|Salzburg|Salzburg|SZG||
prague_cz|czech|Prague|Prague|Praha|PRG||
krakow_pl|poland|Krakow|Krakow|Kraków|KRK||
warsaw_pl|poland|Warsaw|Warsaw|Warszawa|WAW||
bucharest|romania|Bucharest|Bucharest|București|OTP||
sofia|bulgaria|Sofia|Sofia|Sofia|SOF||
zagreb|croatia|Zagreb|Zagreb|Zagreb|ZAG||
dubrovnik|croatia|Dubrovnik|Dubrovnik|Dubrovnik|DBV||
split|croatia|Split|Split|Split|SPU||
reykjavik_is|iceland|Reykjavik|Reykjavik|Reykjavík|KEF||
oslo_no|norway|Oslo|Oslo|Oslo|OSL||
bergen|norway|Bergen|Bergen|Bergen|BGO||
copenhagen_dk|denmark|Copenhagen|Copenhagen|København|CPH||
helsinki_fi|finland|Helsinki|Helsinki|Helsinki|HEL||
riga|latvia|Riga|Riga|Rīga|RIX||
vilnius|lithuania|Vilnius|Vilnius|Vilnius|VNO||
tallinn|estonia|Tallinn|Tallinn|Tallinn|TLL||
san_diego|usa|San Diego|San Diego|San Diego|SAN||
austin|usa|Austin|Austin|Austin|AUS||
nashville|usa|Nashville|Nashville|Nashville|BNA||
new_orleans|usa|New Orleans|New Orleans|New Orleans|MSY||
portland|usa|Portland|Portland|Portland|PDX||
salt_lake_city|usa|Salt Lake City|Salt Lake City|Salt Lake City|SLC||
minneapolis|usa|Minneapolis|Minneapolis|Minneapolis|MSP||
detroit|usa|Detroit|Detroit|Detroit|DTW||
philadelphia|usa|Philadelphia|Philadelphia|Philadelphia|PHL||
charlotte|usa|Charlotte|Charlotte|Charlotte|CLT||
tampa|usa|Tampa|Tampa|Tampa|TPA||
san_antonio|usa|San Antonio|San Antonio|San Antonio|SAT||
kansas_city|usa|Kansas City|Kansas City|Kansas City|MCI||
st_louis|usa|St Louis|St Louis|St Louis|STL||
pittsburgh|usa|Pittsburgh|Pittsburgh|Pittsburgh|PIT||
cleveland|usa|Cleveland|Cleveland|Cleveland|CLE||
cincinnati|usa|Cincinnati|Cincinnati|Cincinnati|CVG||
indianapolis|usa|Indianapolis|Indianapolis|Indianapolis|IND||
columbus|usa|Columbus|Columbus|Columbus|CMH||
raleigh|usa|Raleigh|Raleigh|Raleigh|RDU||
richmond|usa|Richmond|Richmond|Richmond|RIC||
jacksonville|usa|Jacksonville|Jacksonville|Jacksonville|JAX||
memphis|usa|Memphis|Memphis|Memphis|MEM||
louisville|usa|Louisville|Louisville|Louisville|SDF||
oklahoma_city|usa|Oklahoma City|Oklahoma City|Oklahoma City|OKC||
albuquerque|usa|Albuquerque|Albuquerque|Albuquerque|ABQ||
tucson|usa|Tucson|Tucson|Tucson|TUS||
sacramento|usa|Sacramento|Sacramento|Sacramento|SMF||
san_jose|usa|San Jose|San Jose|San Jose|SJC||
oakland|usa|Oakland|Oakland|Oakland|OAK||
long_beach|usa|Long Beach|Long Beach|Long Beach|LGB||
palm_springs|usa|Palm Springs|Palm Springs|Palm Springs|PSP||
santa_barbara|usa|Santa Barbara|Santa Barbara|Santa Barbara|SBA||
monterey|usa|Monterey|Monterey|Monterey|MRY||
anchorage|usa|Anchorage|Anchorage|Anchorage|ANC||
fairbanks|usa|Fairbanks|Fairbanks|Fairbanks|FAI||
`.trim().split("\n");

  root.LOCATIONS_CHUNK_EXTRA = {
    tag: "extra-v1",
    cities: (root.LOCATIONS_WORLD_SEED?.parseLines?.(EXTRA_LINES) || [])
  };
})(typeof window !== "undefined" ? window : globalThis);
