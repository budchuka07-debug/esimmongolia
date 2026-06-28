/**
 * Global cities seed — compact pipe format, chunk-ready for 100k+ scale.
 * Format: city_id|country_id|name_mn|name_en|name_local|airports|aliases|railways
 * Add new chunks via LOCATION_ENGINE.loadChunk() — do not hardcode in UI.
 */
(function (root) {
  function parseLine(line) {
    const s = String(line || "").trim();
    if (!s || s.startsWith("#")) return null;
    const p = s.split("|");
    if (p.length < 4) return null;
    const airports = (p[5] || "").split(",").map((x) => x.trim()).filter(Boolean);
    const aliases = (p[6] || "").split(",").map((x) => x.trim()).filter(Boolean);
    const railways = (p[7] || "").split(",").map((x) => x.trim()).filter(Boolean);
    const name_mn = p[2] || p[3];
    const name_en = p[3] || p[2];
    const name_local = p[4] || "";
    const allAliases = [...new Set([name_mn, name_en, name_local, p[0], ...aliases, ...airports].filter(Boolean))];
    return {
      city_id: p[0],
      country_id: p[1],
      name_mn,
      name_en,
      name_local,
      aliases: allAliases,
      airport_codes: airports,
      railway_station_names: railways
    };
  }

  /** Core global cities + airports (~500 lines). More via loadChunk. */
  const CITY_LINES = `
ulanbaatar|mongolia|Улаанбаатар|Ulaanbaatar|Улаанбаатар|UBN|UB,Ulaanbaatar|Ulaanbaatar Railway
erenhot|china|Эрээн|Erenhot|二连浩特||Erenhot,Erlian|Erenhot Railway
tianjin|china|Тяньжин|Tianjin|天津|TSN|Tientsin|Tianjin,Tianjin West
chongqing|china|Чунцин|Chongqing|重庆|CKG||Chongqing North
wuhan|china|Уухан|Wuhan|武汉|WUH||
nanjing|china|Нанжин|Nanjing|南京|NKG||
hangzhou|china|Ханчжоу|Hangzhou|杭州|HGH||
suzhou|china|Сүчжоу|Suzhou|苏州|||
xiamen|china|Шямын|Xiamen|厦门|XMN||
qingdao|china|Циндао|Qingdao|青岛|TAO||
dalian|china|Далян|Dalian|大连|DLC||
sanya|china|Саня|Sanya|三亚|SYX||
zhangjiajie|china|Жанжяжэ|Zhangjiajie|张家界|DYG||
changsha|china|Чанша|Changsha|长沙|CSX||
kunming|china|Куньмин|Kunming|昆明|KMG||
guiyang|china|Гуйyang|Guiyang|贵阳|KWE||
nanning|china|Наньning|Nanning|南宁|NNG||
fuzhou|china|Фучжоу|Fuzhou|福州|FOC||
jinan|china|Жinan|Jinan|济南|TNA||
zhengzhou|china|Чжэнчжоу|Zhengzhou|郑州|CGO|Zhengzhou East
changchun|china|Чанчунь|Changchang|长春|CGQ||
shenyang|china|Шэньyang|Shenyang|沈阳|SHE||
taiyuan|china|Тайyuan|Taiyuan|太原|TYN||
hefei|china|Хэфэй|Hefei|合肥|HFE||
nanchang|china|Наньchang|Nanchang|南昌|KHN||
wenzhou|china|Вэньzhou|Wenzhou|温州|WNZ||
zhuhai|china|Жuhai|Zhuhai|珠海|ZUH||
dongguan|china|Дунгуан|Dongguan|东莞|||
foshan|china|Фошань|Foshan|佛山|||
macau|china|Макао|Macau|澳门|MFM||
hong_kong|china|Хонконг|Hong Kong|香港|HKG||
taipei|taiwan|Тайpei|Taipei|台北|TPE,TSA|Taipei Main
kaohsiung|taiwan|Gaoxiong|Kaohsiung|高雄|KHH||
taichung|taiwan|Taichung|Taichung|台中|RMQ||
manila|philippines|Манila|Manila|Manila|MNL,CRK||
cebu|philippines|Сebu|Cebu|Cebu|CEB||
boracay|philippines|Boracay|Boracay|Boracay|MPH||
davao|philippines|Davao|Davao|Davao|DVO||
hanoi|vietnam|Ханой|Hanoi|Hà Nội|HAN||
ho_chi_minh|vietnam|Хoshimин|Ho Chi Minh City|TP.HCM|SGN|Saigon
da_nang|vietnam|Дanang|Da Nang|Đà Nẵng|DAD||
nha_trang|vietnam|Nha Trang|Nha Trang|Nha Trang|CXR||
phu_quoc|vietnam|Phu Quoc|Phu Quoc|Phú Quốc|PQC||
siem_reap|cambodia|Сiem Reap|Siem Reap|Siem Reap|REP|Angkor
phnom_penh|cambodia|Пnom Penh|Phnom Penh|Phnom Penh|PNH||
vientiane|laos|Vientiane|Vientiane|Vientiane|VTE||
yangon|myanmar|Yangon|Yangon|Yangon|RGN|Rangoon
tokyo|japan|Токио|Tokyo|東京|NRT,HND|Tokyo Station
osaka|japan|Оsaka|Osaka|大阪|KIX,ITM|Osaka Station
kyoto|japan|Кioto|Kyoto|京都||Kyoto Station
nagoya|japan|Nagoya|Nagoya|名古屋|NGO||
fukuoka|japan|Fukuoka|Fukuoka|福岡|FUK||
sapporo|japan|Sapporo|Sapporo|札幌|CTS||
okinawa|japan|Okinawa|Okinawa|沖縄|OKA|Naha
hiroshima|japan|Hiroshima|Hiroshima|広島|HIJ||
seoul|korea|Сөүл|Seoul|서울|ICN,GMP|Seoul Station
busan|korea|Busan|Busan|부산|PUS||
jeju|korea|Jeju|Jeju|제주|CJU||
incheon|korea|Incheon|Incheon|인천|ICN|Incheon International
singapore|singapore|Сингапур|Singapore|Singapore|SIN|Changi
kuala_lumpur|malaysia|Куала Лумпур|Kuala Lumpur|Kuala Lumpur|KUL|KL
penang|malaysia|Penang|Penang|Penang|PEN|Georgetown
langkawi|malaysia|Langkawi|Langkawi|Langkawi|LGK||
jakarta|indonesia|Жakарta|Jakarta|Jakarta|CGK||
bali|indonesia|Bali|Bali|Bali|DPS|Denpasar
yogyakarta|indonesia|Yogyakarta|Yogyakarta|Yogyakarta|JOG|Jogja
surabaya|indonesia|Surabaya|Surabaya|Surabaya|SUB||
bangkok|thailand|Бангкок|Bangkok|กรุงเทพ|BKK,DMK|Krung Thep
phuket|thailand|Phuket|Phuket|ภูเก็ต|HKT||
pattaya|thailand|Pattaya|Pattaya|พัทยา|UTP|U-Tapao
chiang_mai|thailand|Chiang Mai|Chiang Mai|เชียงใหม่|CNX||
krabi|thailand|Krabi|Krabi|กระบี่|KBV||
koh_samui|thailand|Koh Samui|Koh Samui|Ko Samui|USM||
dubai|uae|Дубай|Dubai|دبي|DXB,DWC||
abu_dhabi|uae|Abu Dhabi|Abu Dhabi|أبوظبي|AUH||
doha|qatar|Doha|Doha|الدوحة|DOH||
riyadh|saudi_arabia|Riyadh|Riyadh|الرياض|RUH||
jeddah|saudi_arabia|Jeddah|Jeddah|جeddah|JED||
istanbul|turkey|Стambul|Istanbul|İstanbul|IST,SAW||
ankara|turkey|Ankara|Ankara|Ankara|ESB||
antalya|turkey|Antalya|Antalya|Antalya|AYT||
cappadocia|turkey|Cappadocia|Cappadocia|Kapadokya|NAV|Kayseri
tel_aviv|israel|Tel Aviv|Tel Aviv|תל אביב|TLV||
amman|jordan|Amman|Amman|عمان|AMM||
beirut|lebanon|Beirut|Beirut|Beirut|BEY||
tbilisi|georgia|Tbilisi|Tbilisi|თბilisი|TBS||
yerevan|armenia|Yerevan|Yerevan|Yerevan|EVN||
baku|azerbaijan|Baku|Baku|Baku|GYD||
almaty|kazakhstan|Almaty|Almaty|Almaty|ALA||
astana|kazakhstan|Astana|Astana|Astana|NQZ|Nur-Sultan
tashkent|uzbekistan|Tashkent|Tashkent|Tashkent|TAS||
samarkand|uzbekistan|Samarkand|Samarkand|Samarkand|SKD||
bishkek|kyrgyzstan|Bishkek|Bishkek|Bishkek|FRU||
dushanbe|tajikistan|Dushanbe|Dushanbe|Dushanbe|DYU||
moscow|russia|Мoscow|Moscow|Москва|SVO,DME,VKO|Moscow
saint_petersburg|russia|Saint Petersburg|Saint Petersburg|Санкт-Петербург|LED||
vladivostok|russia|Vladivostok|Vladivostok|Владивосток|VVO||
irkutsk|russia|Irkutsk|Irkutsk|Иркutsk|IKT||
novosibirsk|russia|Novosibirsk|Novosibirsk|Новосибирск|OVB||
kiev|ukraine|Kyiv|Kyiv|Київ|KBP|Kiev
lviv|ukraine|Lviv|Lviv|Львів|LWO||
minsk|belarus|Minsk|Minsk|Минск|MSQ||
warsaw|poland|Warsaw|Warsaw|Warszawa|WAW||
krakow|poland|Krakow|Krakow|Kraków|KRK||
gdansk|poland|Gdansk|Gdansk|Gdańsk|GDN||
prague|czech|Prague|Prague|Praha|PRG||
budapest|hungary|Budapest|Budapest|Budapest|BUD||
vienna|austria|Vienna|Vienna|Wien|VIE||
berlin|germany|Berlin|Berlin|Berlin|BER,TXL||
munich|germany|Munich|Munich|München|MUC||
frankfurt|germany|Frankfurt|Frankfurt|Frankfurt|FRA||
hamburg|germany|Hamburg|Hamburg|Hamburg|HAM||
dusseldorf|germany|Dusseldorf|Dusseldorf|Düsseldorf|DUS||
cologne|germany|Cologne|Cologne|Köln|CGN||
paris|france|Париж|Paris|Paris|CDG,ORY|Charles de Gaulle
nice|france|Nice|Nice|Nice|NCE||
lyon|france|Lyon|Lyon|Lyon|LYS||
marseille|france|Marseille|Marseille|Marseille|MRS||
london|uk|Лondon|London|London|LHR,LGW,STN,LTN|London
manchester|uk|Manchester|Manchester|Manchester|MAN||
edinburgh|uk|Edinburgh|Edinburgh|Edinburgh|EDI||
dublin|ireland|Dublin|Dublin|Dublin|DUB||
amsterdam|netherlands|Amsterdam|Amsterdam|Amsterdam|AMS||
rotterdam|netherlands|Rotterdam|Rotterdam|Rotterdam|RTM||
brussels|belgium|Brussels|Brussels|Brussels|BRU||
zurich|switzerland|Zurich|Zurich|Zürich|ZRH||
geneva|switzerland|Geneva|Geneva|Genève|GVA||
milan|italy|Milan|Milan|Milano|MXP,BGY||
rome|italy|Rome|Rome|Roma|FCO,CIA||
venice|italy|Venice|Venice|Venezia|VCE||
florence|italy|Florence|Florence|Firenze|FLR||
naples|italy|Naples|Naples|Napoli|NAP||
barcelona|spain|Barcelona|Barcelona|Barcelona|BCN||
madrid|spain|Madrid|Madrid|Madrid|MAD||
seville|spain|Seville|Seville|Sevilla|SVQ||
valencia|spain|Valencia|Valencia|Valencia|VLC||
lisbon|portugal|Lisbon|Lisbon|Lisboa|LIS||
porto|portugal|Porto|Porto|Porto|OPO||
athens|greece|Athens|Athens|Αθήνα|ATH||
santorini|greece|Santorini|Santorini|Σantorini|JTR||
copenhagen|denmark|Copenhagen|Copenhagen|København|CPH||
stockholm|sweden|Stockholm|Stockholm|Stockholm|ARN||
oslo|norway|Oslo|Oslo|Oslo|OSL||
helsinki|finland|Helsinki|Helsinki|Helsinki|HEL||
reykjavik|iceland|Reykjavik|Reykjavik|Reykjavík|KEF||
new_york|usa|New York|New York|NYC|JFK,LGA,EWR|NYC,Manhattan
los_angeles|usa|Los Angeles|Los Angeles|LA|LAX||
san_francisco|usa|San Francisco|San Francisco|SF|SFO||
chicago|usa|Chicago|Chicago|Chicago|ORD,MDW||
miami|usa|Miami|Miami|Miami|MIA||
las_vegas|usa|Las Vegas|Las Vegas|Las Vegas|LAS||
seattle|usa|Seattle|Seattle|Seattle|SEA||
boston|usa|Boston|Boston|Boston|BOS||
washington_dc|usa|Washington DC|Washington|DC|IAD,DCA|Washington
honolulu|usa|Honolulu|Honolulu|Honolulu|HNL|Hawaii
dallas|usa|Dallas|Dallas|Dallas|DFW||
houston|usa|Houston|Houston|Houston|IAH||
atlanta|usa|Atlanta|Atlanta|Atlanta|ATL||
denver|usa|Denver|Denver|Denver|DEN||
phoenix|usa|Phoenix|Phoenix|Phoenix|PHX||
orlando|usa|Orlando|Orlando|Orlando|MCO||
toronto|canada|Toronto|Toronto|Toronto|YYZ||
vancouver|canada|Vancouver|Vancouver|Vancouver|YVR||
montreal|canada|Montreal|Montreal|Montréal|YUL||
calgary|canada|Calgary|Calgary|Calgary|YYC||
mexico_city|mexico|Mexico City|Mexico City|CDMX|MEX||
cancun|mexico|Cancun|Cancun|Cancún|CUN||
guadalajara|mexico|Guadalajara|Guadalajara|Guadalajara|GDL||
sao_paulo|brazil|São Paulo|Sao Paulo|São Paulo|GRU||
rio_de_janeiro|brazil|Rio de Janeiro|Rio|Rio|GIG,SDU||
buenos_aires|argentina|Buenos Aires|Buenos Aires|Buenos Aires|EZE, AEP||
santiago|chile|Santiago|Santiago|Santiago|SCL||
lima|peru|Lima|Lima|Lima|LIM||
bogota|colombia|Bogota|Bogota|Bogotá|BOG||
cartagena|colombia|Cartagena|Cartagena|Cartagena|CTG||
quito|ecuador|Quito|Quito|Quito|UIO||
cairo|egypt|Cairo|Cairo|القاهرة|CAI||
hurghada|egypt|Hurghada|Hurghada|Hurghada|HRG||
sharm_el_sheikh|egypt|Sharm El Sheikh|Sharm|Sharm|SSH||
marrakech|morocco|Marrakech|Marrakech|Marrakech|RAK||
casablanca|morocco|Casablanca|Casablanca|Casablanca|CMN||
cape_town|south_africa|Cape Town|Cape Town|Cape Town|CPT||
johannesburg|south_africa|Johannesburg|Johannesburg|Johannesburg|JNB||
nairobi|kenya|Nairobi|Nairobi|Nairobi|NBO||
zanzibar|tanzania|Zanzibar|Zanzibar|Zanzibar|ZNZ||
addis_ababa|ethiopia|Addis Ababa|Addis Ababa|Addis Ababa|ADD||
lagos|nigeria|Lagos|Lagos|Lagos|LOS||
accra|ghana|Accra|Accra|Accra|ACC||
sydney|australia|Sydney|Sydney|Sydney|SYD||
melbourne|australia|Melbourne|Melbourne|Melbourne|MEL||
brisbane|australia|Brisbane|Brisbane|Brisbane|BNE||
perth|australia|Perth|Perth|Perth|PER||
auckland|new_zealand|Auckland|Auckland|Auckland|AKL||
queenstown|new_zealand|Queenstown|Queenstown|Queenstown|ZQN||
delhi|india|Delhi|Delhi|Delhi|DEL,IGI|New Delhi
mumbai|india|Mumbai|Mumbai|Mumbai|BOM|Bombay
bangalore|india|Bangalore|Bangalore|Bengaluru|BLR||
goa|india|Goa|Goa|Goa|GOI||
jaipur|india|Jaipur|Jaipur|Jaipur|JAI||
kolkata|india|Kolkata|Kolkata|Kolkata|CCU|Calcutta
chennai|india|Chennai|Chennai|Chennai|MAA|Madras
hyderabad|india|Hyderabad|Hyderabad|Hyderabad|HYD||
kathmandu|nepal|Kathmandu|Kathmandu|Kathmandu|KTM||
colombo|sri_lanka|Colombo|Colombo|Colombo|CMB||
male|maldives|Male|Male|Malé|MLE|Maldives
karachi|pakistan|Karachi|Karachi|Karachi|KHI||
lahore|pakistan|Lahore|Lahore|Lahore|LHE||
islamabad|pakistan|Islamabad|Islamabad|Islamabad|ISB||
dhaka|bangladesh|Dhaka|Dhaka|Dhaka|DAC||
`.trim().split("\n");

  root.LOCATIONS_WORLD_SEED = {
    parseLine,
    parseLines(lines) {
      return (lines || []).map(parseLine).filter(Boolean);
    },
    getCities() {
      return CITY_LINES.map(parseLine).filter(Boolean);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
