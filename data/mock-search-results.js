/**
 * Mock search — city-filtered hotels, normalized train routes
 * Supplier fields in internal_supplier_reference only (never shown in UI)
 */
(function () {
  const FALLBACK_IMG = "/images/china/guide/hero.jpg";

  const IMG = {
    exterior: [
      "/images/china/guide/shanghai.jpg",
      "/images/china/guide/beijing.jpg",
      "/images/china/guide/guangzhou.jpg",
      "/images/china/guide/shenzhen-city.jpg",
      "/images/routes/china/shanghai-bund.jpg",
      "/images/routes/china/forbidden-city.jpg",
      "/images/routes/china/canton-tower.jpg",
      "/images/routes/china/summer-palace.jpg"
    ],
    room: [
      "/images/china/guide/shop-mall.jpg",
      "/images/china/guide/overview-shanghai.jpg",
      "/images/china/guide/overview-beijing.jpg",
      "/images/routes/china/yu-garden.jpg"
    ],
    lobby: [
      "/images/routes/china/national-museum.jpg",
      "/images/routes/china/temple-of-heaven.jpg",
      "/images/china/guide/culture-temple.jpg"
    ],
    bathroom: [
      "/images/china/guide/food-hotpot.jpg",
      "/images/china/guide/transport-metro.jpg"
    ],
    restaurant: [
      "/images/china/guide/food-peking-duck.jpg",
      "/images/routes/china/hangzhou-westlake.jpg"
    ]
  };

  const CITY_COVER = {
    shanghai: ["/images/china/guide/shanghai.jpg", "/images/routes/china/shanghai-bund.jpg", "/images/routes/china/yu-garden.jpg", "/images/routes/china/disneyland.jpg"],
    beijing: ["/images/china/guide/beijing.jpg", "/images/routes/china/forbidden-city.jpg", "/images/routes/china/summer-palace.jpg", "/images/routes/china/great-wall.jpg"],
    guangzhou: ["/images/china/guide/guangzhou.jpg", "/images/routes/china/canton-tower.jpg", "/images/routes/china/chen-clan.jpg"],
    shenzhen: ["/images/china/guide/shenzhen-city.jpg", "/images/routes/china/oct-harbour.jpg", "/images/routes/china/shenzhen.jpg"],
    hohhot: ["/images/china/guide/hohhot.jpg", "/images/routes/china/hohhot.jpg"],
    chengdu: ["/images/routes/china/chengdu-panda.jpg", "/images/routes/china/panda.jpg"],
    harbin: ["/images/routes/china/tianjin-culture.jpg", "/images/china/guide/tianjin.jpg"],
    xian: ["/images/routes/china/xian-terracotta.jpg", "/images/routes/china/xian-wall.jpg"],
    zhangjiajie: ["/images/routes/china/zhangjiajie.jpg", "/images/routes/china/huangshan.jpg"],
    yiwu: ["/images/routes/china/chen-clan.jpg", "/images/china/guide/shop-tech.jpg"]
  };

  function pick(arr, i) {
    return arr[i % arr.length];
  }

  function hotelImages(cityId, idx) {
    const covers = CITY_COVER[cityId] || IMG.exterior;
    return [
      pick(covers, idx),
      pick(IMG.room, idx + 1),
      pick(IMG.lobby, idx + 2),
      pick(IMG.bathroom, idx + 3),
      pick(IMG.restaurant, idx + 4)
    ];
  }

  /** Compact specs per city — expanded to full hotel objects at search time */
  const HOTEL_SPECS = {
    shanghai: [
      { name_mn: "Бунд голын тэнгэрийн зочид буудал", name_en: "Bund Skyline Hotel", district: "The Bund", stars: 5, desc: "Хуанпу голын эрэг, дээд зэргийн ресторан, метротой ойр.", metro: "Nanjing East 4 мин", attraction: "The Bund 3 мин", price: 720, rooms: ["Deluxe King", "Bund View Suite"], amenities: ["WiFi", "Өглөөний цай", "Фитнес", "SPA"] },
      { name_mn: "Пудун бизнес зочид буудал", name_en: "Pudong Business Hotel", district: "Lujiazui", stars: 4, desc: "Oriental Pearl харагдана. Бизнес аялалд тохиромжтой.", metro: "Lujiazui 2 мин", attraction: "Oriental Pearl 8 мин", price: 580, rooms: ["Standard Twin", "Executive King"], amenities: ["WiFi", "Өглөөний цай", "Лонж"] },
      { name_mn: "Нанжин замын төв буудал", name_en: "Nanjing Road Central", district: "People's Square", stars: 4, desc: "Дэлгүүр, ресторант ойрхон. Гэр бүлд тохиромжтой.", metro: "People's Square 4 мин", attraction: "Nanjing Road 2 мин", price: 480, rooms: ["Family Room", "Queen Room"], amenities: ["WiFi", "Цуцлах боломжтой"] },
      { name_mn: "Франц концесс boutique", name_en: "French Concession Boutique", district: "Xuhui", stars: 4, desc: "Гудамж, кафе, Instagram газрууд ойрхон.", metro: "Jing'an Temple 8 мин", attraction: "Tianzifang 10 мин", price: 520, rooms: ["Boutique Queen", "Garden View"], amenities: ["WiFi", "Өглөөний цай", "Кафе"] },
      { name_mn: "Disney Resort Partner", name_en: "Disney Resort Partner", district: "Pudong Disney", stars: 4, desc: "Disneyland шаттлалтай автобус. Хүүхэдтэй гэр бүлд.", metro: "Disney 12 мин", attraction: "Disneyland 8 мин", price: 560, rooms: ["Theme Room", "Standard Twin"], amenities: ["WiFi", "Өглөөний цай", "Shuttle"] },
      { name_mn: "Хунцяо нисэх буудлын холбоос", name_en: "Hongqiao Airport Link", district: "Minhang", stars: 3, desc: "Нисэх буудал, HSR ойр. Эрт нислэгт тохиромжтой.", metro: "Hongqiao 6 мин", attraction: "HSR станц 5 мин", price: 340, rooms: ["Economy Twin", "King Room"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Ю садын өв соёлын буудал", name_en: "Yu Garden Heritage Stay", district: "Old City", stars: 3, desc: "Уламжлалт хороолол, Yu Garden алхамын зайд.", metro: "Yuyuan 5 мин", attraction: "Yu Garden 3 мин", price: 310, rooms: ["Heritage Twin", "Classic King"], amenities: ["WiFi", "Цуцлах боломжтой"] },
      { name_mn: "Жинъань бизнес цогцолбор", name_en: "Jing'an Business Suites", district: "Jing'an", stars: 5, desc: "Төв байршил, өрөө+зочид булан, WiFi хурдан.", metro: "Jing'an Temple 1 мин", attraction: "West Nanjing Rd 5 мин", price: 780, rooms: ["Junior Suite", "Business King"], amenities: ["WiFi", "SPA", "Өглөөний цай", "Фитнес"] }
    ],
    beijing: [
      { name_mn: "Гүн улаан хаалгын зочид буудал", name_en: "Forbidden City View Hotel", district: "Dongcheng", stars: 5, desc: "Төв Бээжин, Гүн улаан хаалга ойрхон.", metro: "Tiananmen East 6 мин", attraction: "Forbidden City 10 мин", price: 690, rooms: ["Imperial View King", "Deluxe Twin"], amenities: ["WiFi", "Өглөөний цай", "Ресторан"] },
      { name_mn: "Хуандү шилийн зочид буудал", name_en: "Summer Palace Resort", district: "Haidian", stars: 4, desc: "Хуандү шилийн цэцэрлэгт хүрээлэн ойр.", metro: "Beigongmen 8 мин", attraction: "Summer Palace 5 мин", price: 520, rooms: ["Garden King", "Lake View"], amenities: ["WiFi", "Өглөөний цай", "Цэцэрлэг"] },
      { name_mn: "Тэнгэрийн сүмийн төв буудал", name_en: "Temple of Heaven Central", district: "Chongwen", stars: 4, desc: "Тэнгэрийн сүм, хуучин Бээжин мэдрэмж.", metro: "Tiantan East 5 мин", attraction: "Temple of Heaven 7 мин", price: 450, rooms: ["Standard King", "Twin Room"], amenities: ["WiFi", "Цуцлах боломжтой"] },
      { name_mn: "Гуанжоу өргөн замын бизнес", name_en: "CBD Guomao Business", district: "Chaoyang CBD", stars: 4, desc: "Бизнес төв, олон улсын компаниуд ойрхон.", metro: "Guomao 3 мин", attraction: "CCTV Tower 12 мин", price: 580, rooms: ["Executive King", "Twin CBD"], amenities: ["WiFi", "Лонж", "Фитнес"] },
      { name_mn: "798 урлагийн дүүргийн boutique", name_en: "798 Art District Boutique", district: "Dashanzi", stars: 3, desc: "Урлагийн галерей, кафе, залуучуудад.", metro: "Wangjing South 10 мин", attraction: "798 Art Zone 5 мин", price: 380, rooms: ["Art Queen", "Loft Twin"], amenities: ["WiFi", "Кафе"] },
      { name_mn: "Бээжин өргөн замын value stay", name_en: "Chang'an Value Stay", district: "Xicheng", stars: 3, desc: "Хямд, цэвэр, метротой ойр.", metro: "Fuxingmen 4 мин", attraction: "Tiananmen 15 мин", price: 290, rooms: ["Economy Twin", "Standard King"], amenities: ["WiFi"] },
      { name_mn: "Мутянью Гийн хэрэмийн амралт", name_en: "Mutianyu Great Wall Lodge", district: "Huairou", stars: 4, desc: "Гийн хэрэм рүү шууд аялал зохионо.", metro: "—", attraction: "Great Wall 20 мин", price: 620, rooms: ["Mountain View", "Family Suite"], amenities: ["WiFi", "Өглөөний цай", "Тур"] }
    ],
    hohhot: [
      { name_mn: "Хөх хот төв зочид буудал", name_en: "Hohhot Central Hotel", district: "Xincheng", stars: 4, desc: "Хотын төв, Дазhao хийд ойрхон.", metro: "—", attraction: "Dazhao Temple 8 мин", price: 320, rooms: ["Standard King", "Twin Room"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Монголын өв соёлын буудал", name_en: "Mongol Heritage Inn", district: "Huimin", stars: 3, desc: "Уламжлалт хоол, Монгол найрсаг үйлчилгээ.", metro: "—", attraction: "Islamic Street 5 мин", price: 260, rooms: ["Heritage Twin", "King Room"], amenities: ["WiFi", "Ресторан"] },
      { name_mn: "Хөх хот HSR станцын холбоос", name_en: "HSR Station Link Hotel", district: "Yuquan", stars: 3, desc: "Өндөр хурдны галт тэрэгт ойр. Бээжин рүү 2 цаг.", metro: "—", attraction: "HSR станц 3 мин", price: 280, rooms: ["Transit Twin", "Early Bird King"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Шилийн талын амралтын буудал", name_en: "Grassland Retreat Hotel", district: "Outskirts", stars: 4, desc: "Шилийн талын аялал, Xilamuren ойролцоо.", metro: "—", attraction: "Grassland 45 мин", price: 420, rooms: ["Yurt Style Suite", "Standard King"], amenities: ["WiFi", "Тур", "Хоол"] },
      { name_mn: "Хөх хот бизнес зочид буудал", name_en: "Hohhot Business Hotel", district: "Saihan", stars: 3, desc: "Бизнес аялал, WiFi хурдан.", metro: "—", attraction: "City center 5 мин", price: 240, rooms: ["Business Twin", "King Room"], amenities: ["WiFi", "Лонж"] },
      { name_mn: "Зочид буудлын цогцолбор", name_en: "Hohhot Plaza Suites", district: "Xincheng", stars: 4, desc: "Өрөө+зочид булан, гэр бүлд тохиромжтой.", metro: "—", attraction: "Park 6 мин", price: 380, rooms: ["Family Suite", "Deluxe King"], amenities: ["WiFi", "Өглөөний цай", "Фитнес"] }
    ],
    guangzhou: [
      { name_mn: "Кантон цамхгийн харагдац", name_en: "Canton Tower View Hotel", district: "Haizhu", stars: 5, desc: "Zhujiang харагдана, Pearl River ойр.", metro: "Canton Tower 5 мин", attraction: "Canton Tower 8 мин", price: 650, rooms: ["Tower View King", "River Suite"], amenities: ["WiFi", "SPA", "Өглөөний цай"] },
      { name_mn: "Шамян аралын boutique", name_en: "Shamian Island Boutique", district: "Liwan", stars: 4, desc: "Колони архитектур, тайван орчин.", metro: "Huangsha 8 мин", attraction: "Shamian 3 мин", price: 480, rooms: ["Colonial Queen", "Garden Twin"], amenities: ["WiFi", "Кафе", "Цэцэрлэг"] },
      { name_mn: "Гуанжоу өмнөд HSR буудал", name_en: "Guangzhou South HSR Hotel", district: "Panyu", stars: 4, desc: "HSR станцтай холбогдсон. Шэньжэнь рүү хурдан.", metro: "Guangzhou South 2 мин", attraction: "HSR 1 мин", price: 420, rooms: ["Transit King", "Twin HSR"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Чэн клан академийн ойрхон", name_en: "Chen Clan Academy Stay", district: "Liwan", stars: 3, desc: "Уламжлалт урлал, хоолны гудамж ойр.", metro: "Chen Clan 4 мин", attraction: "Chen Clan 6 мин", price: 350, rooms: ["Standard Twin", "King Room"], amenities: ["WiFi"] },
      { name_mn: "Тяньхэ бизнес зочид буудал", name_en: "Tianhe Business Hotel", district: "Tianhe", stars: 4, desc: "Дэлгүүр, офис төв ойрхон.", metro: "Tianhe Sports 3 мин", attraction: "Teemall 5 мин", price: 460, rooms: ["Executive King", "Twin CBD"], amenities: ["WiFi", "Лонж", "Фитнес"] },
      { name_mn: "Байюнь уулын амралт", name_en: "Baiyun Mountain Retreat", district: "Baiyun", stars: 3, desc: "Уулын агаар, амралтын өдөрт.", metro: "Baiyun Ave 12 мин", attraction: "Baiyun Mountain 15 мин", price: 310, rooms: ["Mountain Twin", "King Room"], amenities: ["WiFi", "Ресторан"] },
      { name_mn: "Гуанжоу value central", name_en: "Guangzhou Value Central", district: "Yuexiu", stars: 3, desc: "Хямд, цэвэр, метротой ойр.", metro: "Gongyuanqian 5 мин", attraction: "Beijing Road 8 мин", price: 270, rooms: ["Economy Twin", "Standard King"], amenities: ["WiFi"] }
    ],
    shenzhen: [
      { name_mn: "Футян CBD зочид буудал", name_en: "Futian CBD Hotel", district: "Futian", stars: 5, desc: "Шэньжэнь төв, метро, бизнес төв.", metro: "Convention Center 3 мин", attraction: "Civic Center 5 мин", price: 620, rooms: ["CBD Suite", "Deluxe King"], amenities: ["WiFi", "SPA", "Өглөөний цай"] },
      { name_mn: "OCT Harbour view", name_en: "OCT Harbour View", district: "Nanshan", stars: 4, desc: "Далайн эрэг, nightlife, ресторан.", metro: "Window of World 8 мин", attraction: "OCT Harbour 5 мин", price: 520, rooms: ["Harbour King", "Twin Bay"], amenities: ["WiFi", "Ресторан", "Бар"] },
      { name_mn: "Луоху хилийн буудал", name_en: "Luohu Border Hotel", district: "Luohu", stars: 3, desc: "Хонконг руу шилжихэд тохиромжтой.", metro: "Luohu 2 мин", attraction: "HK border 10 мин", price: 340, rooms: ["Transit Twin", "King Room"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Шэньжэнь tech park stay", name_en: "Tech Park Business", district: "Nanshan", stars: 4, desc: "Tencent, Huawei ойролцоо бизнес аялал.", metro: "Hi-Tech Park 4 мин", attraction: "Tech Park 6 мин", price: 480, rooms: ["Business King", "Twin Executive"], amenities: ["WiFi", "Лонж", "Фитнес"] },
      { name_mn: "Дэлхийн цонхны ойрхон", name_en: "Window of the World Inn", district: "Nanshan", stars: 3, desc: "Үзвэр, гэр бүлийн аялал.", metro: "Window of World 5 мин", attraction: "Window of World 8 мин", price: 360, rooms: ["Family Room", "Standard Twin"], amenities: ["WiFi", "Цуцлах боломжтой"] },
      { name_mn: "Баоань нисэх буудлын холбоос", name_en: "Bao'an Airport Link", district: "Bao'an", stars: 3, desc: "Нисэх буудал, эрт нислэгт.", metro: "Airport East 6 мин", attraction: "SZX airport 12 мин", price: 300, rooms: ["Early Flight Twin", "King Room"], amenities: ["WiFi", "Shuttle"] },
      { name_mn: "Шэньжэнь bay boutique", name_en: "Shenzhen Bay Boutique", district: "Nanshan", stars: 4, desc: "Bay view, шинэ барилга, цэвэр өрөө.", metro: "Houhai 5 мин", attraction: "Bay Park 8 мин", price: 540, rooms: ["Bay View King", "Boutique Twin"], amenities: ["WiFi", "Өглөөний цай", "Фитнес"] }
    ],
    chengdu: [
      { name_mn: "Пандын баазын ойрхон буудал", name_en: "Panda Base Lodge", district: "Chenghua", stars: 4, desc: "Панда харах аялалд тохиромжтой.", metro: "Panda Avenue 15 мин", attraction: "Panda Base 10 мин", price: 420, rooms: ["Panda Theme", "Family Twin"], amenities: ["WiFi", "Өглөөний цай", "Тур"] },
      { name_mn: "Жинли гудамжийн boutique", name_en: "Jinli Street Boutique", district: "Wuhou", stars: 4, desc: "Уламжлалт гудамж, хоол, шөпинг.", metro: "Wuhouci 6 мин", attraction: "Jinli 3 мин", price: 460, rooms: ["Heritage Queen", "Twin Classic"], amenities: ["WiFi", "Кафе"] },
      { name_mn: "Чэнду төв зочид буудал", name_en: "Chengdu Central Hotel", district: "Qingyang", stars: 4, desc: "Тэнгэрийн дөрвөлжин ойр, метро.", metro: "Tianfu Square 4 мин", attraction: "People's Park 8 мин", price: 400, rooms: ["Standard King", "Twin CBD"], amenities: ["WiFi", "Лонж"] },
      { name_mn: "Хот пот рестораны буудал", name_en: "Hotpot District Inn", district: "Jinjiang", stars: 3, desc: "Хятад хоолны дүүрэг, үнэ хямд.", metro: "Chunxi Road 5 мин", attraction: "IFS 8 мин", price: 320, rooms: ["Economy Twin", "King Room"], amenities: ["WiFi", "Ресторан"] },
      { name_mn: "Чэнду HSR станцын буудал", name_en: "Chengdu East HSR Hotel", district: "Chenghua", stars: 3, desc: "Өндөр хурдны галт тэрэгт ойр.", metro: "Chengdu East 3 мин", attraction: "HSR 2 мин", price: 340, rooms: ["Transit Twin", "King HSR"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Wide and Narrow Alley stay", name_en: "Kuanzhai Alley Stay", district: "Qingyang", stars: 4, desc: "Хуучин гудамж, Instagram газар.", metro: "Wide Alley 7 мин", attraction: "Kuanzhai 4 мин", price: 480, rooms: ["Alley View King", "Courtyard Twin"], amenities: ["WiFi", "Кафе", "Өглөөний цай"] }
    ],
    harbin: [
      { name_mn: "Харбин төв зочид буудал", name_en: "Harbin Central Hotel", district: "Daoli", stars: 4, desc: "Төв гудамж, өвлийн наадам ойр.", metro: "Central Street 5 мин", attraction: "Central Street 3 мин", price: 380, rooms: ["Standard King", "Twin Room"], amenities: ["WiFi", "Өглөөний цай", "Халаалт"] },
      { name_mn: "Мөсний наадмын буудал", name_en: "Ice Festival Hotel", district: "Songbei", stars: 4, desc: "Ice & Snow World аялалд.", metro: "Ice World 12 мин", attraction: "Ice Festival 8 мин", price: 450, rooms: ["Winter Suite", "Family Twin"], amenities: ["WiFi", "Тур", "Халаалт"] },
      { name_mn: "Сибирийн бар хүрэн амьтан парк ойр", name_en: "Tiger Park Lodge", district: "Songbei", stars: 3, desc: "Tiger Park, гэр бүлийн аялал.", metro: "—", attraction: "Tiger Park 15 мин", price: 310, rooms: ["Family Room", "Standard Twin"], amenities: ["WiFi", "Тур"] },
      { name_mn: "Харбин HSR буудал", name_en: "Harbin West HSR Hotel", district: "Nangang", stars: 3, desc: "Бээжин рүү HSR 5 цаг.", metro: "Harbin West 2 мин", attraction: "HSR 1 мин", price: 290, rooms: ["Transit King", "Twin HSR"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Софийн сүмийн ойрхон", name_en: "St. Sophia View Inn", district: "Daoli", stars: 3, desc: "Орос архитектур, гудамжийн хоол.", metro: "Sophia 6 мин", attraction: "St. Sophia 4 мин", price: 280, rooms: ["Heritage Twin", "King Room"], amenities: ["WiFi"] },
      { name_mn: "Харбин бизнес цогцолбор", name_en: "Harbin Business Suites", district: "Nangang", stars: 4, desc: "Бизнес төв, WiFi хурдан.", metro: "Museum 4 мин", attraction: "City center 6 мин", price: 400, rooms: ["Executive King", "Junior Suite"], amenities: ["WiFi", "Лонж", "Фитнес"] }
    ],
    xian: [
      { name_mn: "Теракота армийн аяллын буудал", name_en: "Terracotta Tour Hotel", district: "Lintong", stars: 4, desc: "Теракота армид ойр, аялал зохионо.", metro: "—", attraction: "Terracotta 20 мин", price: 420, rooms: ["Tour Package Twin", "Family Room"], amenities: ["WiFi", "Тур", "Өглөөний цай"] },
      { name_mn: "Хотын хана boutique", name_en: "City Wall Boutique", district: "Beilin", stars: 4, desc: "Мин ханын дэргэд, дуурийн гудамж.", metro: "Yongningmen 6 мин", attraction: "City Wall 5 мин", price: 460, rooms: ["Wall View King", "Heritage Twin"], amenities: ["WiFi", "Кафе"] },
      { name_mn: "Муслим гудамжийн буудал", name_en: "Muslim Quarter Inn", district: "Lianhu", stars: 3, desc: "Хоолны гудамж, Bell Tower ойр.", metro: "Bell Tower 4 мин", attraction: "Muslim Quarter 2 мин", price: 340, rooms: ["Standard Twin", "King Room"], amenities: ["WiFi", "Ресторан"] },
      { name_mn: "Сиань HSR станцын буудал", name_en: "Xi'an North HSR Hotel", district: "Weiyang", stars: 3, desc: "Өндөр хурдны галт тэрэгт ойр.", metro: "Xi'an North 2 мин", attraction: "HSR 1 мин", price: 310, rooms: ["Transit Twin", "King HSR"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Танг династийн төв", name_en: "Tang Dynasty Central", district: "Yanta", stars: 4, desc: "Wild Goose Pagoda ойрхон.", metro: "Dayanta 5 мин", attraction: "Big Wild Goose 8 мин", price: 440, rooms: ["Pagoda View", "Deluxe King"], amenities: ["WiFi", "SPA", "Өглөөний цай"] },
      { name_mn: "Сиань value stay", name_en: "Xi'an Value Stay", district: "Xincheng", stars: 3, desc: "Хямд, цэвэр, метротой ойр.", metro: "North Street 5 мин", attraction: "Bell Tower 12 мин", price: 270, rooms: ["Economy Twin", "Standard King"], amenities: ["WiFi"] }
    ],
    zhangjiajie: [
      { name_mn: "Аватар уулын зочид буудал", name_en: "Avatar Mountain Lodge", district: "Wulingyuan", stars: 4, desc: "Үндэсний цэцэрлэгт хүрээлэн ойр.", metro: "—", attraction: "ZJJ Forest Park 10 мин", price: 480, rooms: ["Mountain View King", "Family Suite"], amenities: ["WiFi", "Тур", "Өглөөний цай"] },
      { name_mn: "Тяньмэнь уулын буудал", name_en: "Tianmen Mountain Hotel", district: "Yongding", stars: 4, desc: "Кабель машин, шилэн тавцан аялал.", metro: "—", attraction: "Tianmen Mountain 15 мин", price: 450, rooms: ["Cliff View", "Standard Twin"], amenities: ["WiFi", "Тур"] },
      { name_mn: "Жанжяжэ төв зочид буудал", name_en: "Zhangjiajie Central Hotel", district: "Yongding", stars: 3, desc: "Хотын төв, аялалын компаниуд ойр.", metro: "—", attraction: "City center 5 мин", price: 320, rooms: ["Standard King", "Twin Room"], amenities: ["WiFi", "Лонж"] },
      { name_mn: "Ойн амралтын буудал", name_en: "Forest Retreat Inn", district: "Wulingyuan", stars: 3, desc: "Тайван орчин, байгалийн ая.", metro: "—", attraction: "Forest trails 8 мин", price: 300, rooms: ["Forest Twin", "King Room"], amenities: ["WiFi", "Ресторан"] },
      { name_mn: "Жанжяжэ airport link", name_en: "ZJJ Airport Link Hotel", district: "Yongding", stars: 3, desc: "Нисэх буудал, эхлэх цэг.", metro: "—", attraction: "DYG airport 20 мин", price: 280, rooms: ["Transit Twin", "King Room"], amenities: ["WiFi", "Shuttle"] },
      { name_mn: "Grand Canyon view", name_en: "Grand Canyon View Hotel", district: "Cili", stars: 4, desc: "Grand Canyon glass bridge аялал.", metro: "—", attraction: "Glass Bridge 25 мин", price: 420, rooms: ["Canyon View Suite", "Deluxe King"], amenities: ["WiFi", "Тур", "Өглөөний цай"] }
    ],
    yiwu: [
      { name_mn: "Иү худалдааны төвийн буудал", name_en: "Yiwu Trade City Hotel", district: "Futian", stars: 4, desc: "Futian Market алхамын зайд.", metro: "—", attraction: "Futian Market 5 мин", price: 380, rooms: ["Business King", "Twin Trader"], amenities: ["WiFi", "Лонж", "Өглөөний цай"] },
      { name_mn: "Олон улсын худалдааны зочид буудал", name_en: "International Trade Hotel", district: "Choucheng", stars: 4, desc: "Худалдаачдад зориулсан, WiFi хурдан.", metro: "—", attraction: "Trade City 8 мин", price: 400, rooms: ["Executive Suite", "Standard Twin"], amenities: ["WiFi", "Фитнес", "Лонж"] },
      { name_mn: "Иү HSR станцын буудал", name_en: "Yiwu HSR Station Hotel", district: "Beiyuan", stars: 3, desc: "Шанхай, Ханчжоу руу HSR.", metro: "Yiwu 2 мин", attraction: "HSR 1 мин", price: 300, rooms: ["Transit Twin", "King HSR"], amenities: ["WiFi", "Өглөөний цай"] },
      { name_mn: "Иү value central", name_en: "Yiwu Value Central", district: "Choucheng", stars: 3, desc: "Хямд, цэвэр, худалдааны бүс.", metro: "—", attraction: "Market 10 мин", price: 240, rooms: ["Economy Twin", "Standard King"], amenities: ["WiFi"] },
      { name_mn: "Иү plaza suites", name_en: "Yiwu Plaza Suites", district: "Futian", stars: 3, desc: "Өрөө+зочид булан, урт хугацааны худалдаа.", metro: "—", attraction: "Market 6 мин", price: 320, rooms: ["Suite King", "Family Room"], amenities: ["WiFi", "Гал тогоо"] },
      { name_mn: "Иү business inn", name_en: "Yiwu Business Inn", district: "Jiangdong", stars: 3, desc: "Бизнес аялал, ойролцоо ресторан.", metro: "—", attraction: "CBD 8 мин", price: 260, rooms: ["Business Twin", "King Room"], amenities: ["WiFi"] }
    ]
  };

  function buildHotel(cityId, spec, idx, nights) {
    const city = window.TRAVEL_CITIES?.getCity(cityId);
    const imgs = hotelImages(cityId, idx);
    const n = Math.max(1, Number(nights) || 1);
    const supplierPrice = spec.price * n;
    return {
      type: "hotel",
      id: `hotel-${cityId}-${idx}`,
      city_id: cityId,
      name_mn: spec.name_mn,
      name_en: spec.name_en,
      name_cn: spec.name_cn || spec.name_en,
      district: spec.district,
      stars: spec.stars,
      description_mn: spec.desc,
      address: `${spec.district}, ${city?.name_en || cityId}`,
      metro_distance: spec.metro,
      attraction_distance: spec.attraction,
      images: imgs,
      rooms: (spec.rooms || ["Standard Room"]).map((name, ri) => ({
        name,
        image: pick(IMG.room, idx + ri),
        beds: name.includes("Twin") ? 2 : 1,
        price_per_night: spec.price
      })),
      amenities: spec.amenities || ["WiFi"],
      nights: n,
      original_price: supplierPrice,
      currency: "CNY",
      internal_supplier_reference: {
        supplier_name: "internal_partner",
        supplier_url: "",
        supplier_id: `htl-${cityId}-${idx}`,
        supplier_price: supplierPrice,
        currency: "CNY",
        internal_notes: `Mock ${cityId} #${idx}`
      }
    };
  }

  function mockHotels(cityInput, nights) {
    const cityId = window.TRAVEL_CITIES?.normalizeCity(cityInput) || "shanghai";
    const specs = HOTEL_SPECS[cityId] || [];
    if (!specs.length) return [];
    return specs.map((spec, i) => buildHotel(cityId, spec, i, nights));
  }

  const TRAIN_ROUTES = {
    "hohhot-beijing": [
      { train_number: "D6752", depart_time: "08:10", arrive_time: "10:08", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "D6756", depart_time: "10:30", arrive_time: "12:28", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "G2482", depart_time: "13:15", arrive_time: "15:05", duration: "1ц 50мин", seat_type: "1-р зэрэглэл", price: 298 },
      { train_number: "D6764", depart_time: "15:40", arrive_time: "17:38", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "D6770", depart_time: "18:20", arrive_time: "20:18", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "D102", depart_time: "19:45", arrive_time: "23:50", duration: "4ц 05мин", seat_type: "Хэвтээ", price: 220 }
    ],
    "erenhot-beijing": [
      { train_number: "K7922", depart_time: "07:30", arrive_time: "12:15", duration: "4ц 45мин", seat_type: "2-р зэрэглэл", price: 165 },
      { train_number: "K7926", depart_time: "13:00", arrive_time: "17:40", duration: "4ц 40мин", seat_type: "2-р зэрэглэл", price: 165 },
      { train_number: "Z284", depart_time: "18:20", arrive_time: "22:05", duration: "3ц 45мин", seat_type: "1-р зэрэглэл", price: 280 },
      { train_number: "K7930", depart_time: "20:10", arrive_time: "01:05", duration: "4ц 55мин", seat_type: "Хэвтээ", price: 210 }
    ],
    "beijing-shanghai": [
      { train_number: "G1", depart_time: "09:00", arrive_time: "13:28", duration: "4ц 28мин", seat_type: "2-р зэрэглэл", price: 553 },
      { train_number: "G3", depart_time: "10:00", arrive_time: "14:28", duration: "4ц 28мин", seat_type: "1-р зэрэглэл", price: 933 },
      { train_number: "G7", depart_time: "12:30", arrive_time: "16:58", duration: "4ц 28мин", seat_type: "2-р зэрэглэл", price: 553 },
      { train_number: "G13", depart_time: "15:00", arrive_time: "19:28", duration: "4ц 28мин", seat_type: "2-р зэрэглэл", price: 553 },
      { train_number: "G21", depart_time: "17:30", arrive_time: "21:58", duration: "4ц 28мин", seat_type: "1-р зэрэглэл", price: 933 },
      { train_number: "D321", depart_time: "21:10", arrive_time: "07:25", duration: "10ц 15мин", seat_type: "Хэвтээ", price: 420 }
    ],
    "beijing-guangzhou": [
      { train_number: "G79", depart_time: "08:05", arrive_time: "16:01", duration: "7ц 56мин", seat_type: "2-р зэрэглэл", price: 862 },
      { train_number: "G81", depart_time: "10:20", arrive_time: "18:16", duration: "7ц 56мин", seat_type: "1-р зэрэглэл", price: 1380 },
      { train_number: "G83", depart_time: "13:05", arrive_time: "21:01", duration: "7ц 56мин", seat_type: "2-р зэрэглэл", price: 862 }
    ],
    "guangzhou-shenzhen": [
      { train_number: "G6201", depart_time: "07:30", arrive_time: "08:05", duration: "35мин", seat_type: "2-р зэрэглэл", price: 75 },
      { train_number: "G6205", depart_time: "09:15", arrive_time: "09:50", duration: "35мин", seat_type: "2-р зэрэглэл", price: 75 },
      { train_number: "G6211", depart_time: "12:00", arrive_time: "12:35", duration: "35мин", seat_type: "1-р зэрэглэл", price: 100 },
      { train_number: "G6223", depart_time: "17:40", arrive_time: "18:15", duration: "35мин", seat_type: "2-р зэрэглэл", price: 75 }
    ],
    "shanghai-hangzhou": [
      { train_number: "G7321", depart_time: "08:00", arrive_time: "08:45", duration: "45мин", seat_type: "2-р зэрэглэл", price: 73 },
      { train_number: "G7325", depart_time: "11:30", arrive_time: "12:15", duration: "45мин", seat_type: "2-р зэрэглэл", price: 73 }
    ],
    "xian-beijing": [
      { train_number: "G88", depart_time: "09:30", arrive_time: "14:20", duration: "4ц 50мин", seat_type: "2-р зэрэглэл", price: 515 },
      { train_number: "G90", depart_time: "14:00", arrive_time: "18:50", duration: "4ц 50мин", seat_type: "1-р зэрэглэл", price: 824 }
    ],
    "chengdu-chongqing": [
      { train_number: "G8501", depart_time: "08:20", arrive_time: "10:05", duration: "1ц 45мин", seat_type: "2-р зэрэглэл", price: 154 },
      { train_number: "G8511", depart_time: "15:10", arrive_time: "16:55", duration: "1ц 45мин", seat_type: "2-р зэрэглэл", price: 154 }
    ]
  };

  function mockTrains(fromInput, toInput) {
    const fromId = window.TRAVEL_CITIES?.normalizeCity(fromInput);
    const toId = window.TRAVEL_CITIES?.normalizeCity(toInput);
    if (!fromId || !toId || fromId === toId) return { routeKey: null, trains: [] };

    const routeKey = `${fromId}-${toId}`;
    const rows = TRAIN_ROUTES[routeKey] || [];
    const fromMn = window.TRAVEL_CITIES?.getCityLabelMn(fromId) || fromId;
    const toMn = window.TRAVEL_CITIES?.getCityLabelMn(toId) || toId;

    const trains = rows.map((r, i) => ({
      type: "train",
      id: `train-${routeKey}-${i}`,
      from_city_id: fromId,
      to_city_id: toId,
      from_city: fromMn,
      to_city: toMn,
      depart_time: r.depart_time,
      arrive_time: r.arrive_time,
      duration: r.duration,
      train_number: r.train_number,
      seat_type: r.seat_type,
      original_price: r.price,
      currency: "CNY",
      internal_supplier_reference: {
        supplier_name: "internal_rail",
        supplier_url: "",
        supplier_id: `rail-${routeKey}-${r.train_number}`,
        supplier_price: r.price,
        currency: "CNY",
        internal_notes: routeKey
      }
    }));

    return { routeKey, fromId, toId, trains };
  }

  function mockFlights(fromInput, toInput) {
    const fromId = window.TRAVEL_CITIES?.normalizeCity(fromInput) || "ulanbaatar";
    const toId = window.TRAVEL_CITIES?.normalizeCity(toInput) || "shanghai";
    const toMn = window.TRAVEL_CITIES?.getCityLabelMn(toId) || toInput;
    const fromMn = window.TRAVEL_CITIES?.getCityLabelMn(fromId) || fromInput;

    const airportMap = {
      shanghai: { dep: "PVG", arr: "PVG" },
      beijing: { dep: "PEK", arr: "PEK" },
      guangzhou: { dep: "CAN", arr: "CAN" },
      shenzhen: { dep: "SZX", arr: "SZX" },
      ulanbaatar: { dep: "UBN", arr: "UBN" }
    };
    const destAp = airportMap[toId]?.arr || "PVG";
    const fromAp = airportMap[fromId]?.dep || "UBN";

    const flights = [
      { airline: "MIAT Mongolian Airlines", dep: "09:40", arr: "12:35", dur: "2ц 55мин", bag: "23kg багтана", price: 1850 },
      { airline: "Air China", dep: "11:20", arr: "13:10", dur: "2ц 50мин", bag: "23kg", price: 1720 },
      { airline: "China Southern", dep: "14:05", arr: "17:00", dur: "2ц 55мин", bag: "20kg", price: 1680 },
      { airline: "Hunnu Air + transfer", dep: "07:15", arr: "16:40", dur: "9ц 25мин", bag: "2×23kg", price: 1420 },
      { airline: "Korean Air (ICN)", dep: "10:30", arr: "18:15", dur: "7ц 45мин", bag: "23kg", price: 1550 },
      { airline: "MIAT Mongolian Airlines", dep: "18:50", arr: "21:45", dur: "2ц 55мин", bag: "23kg багтана", price: 1920 },
      { airline: "Air China", dep: "16:10", arr: "19:05", dur: "2ц 55мин", bag: "23kg", price: 1780 },
      { airline: "China Eastern", dep: "20:25", arr: "23:10", dur: "2ц 45мин", bag: "20kg", price: 1650 }
    ];

    return flights.map((f, i) => ({
      type: "flight",
      id: `flight-${toId}-${i}`,
      to_city_id: toId,
      from_city_id: fromId,
      airline: f.airline,
      from_city: fromMn,
      to_city: toMn,
      depart_airport: fromAp,
      arrive_airport: destAp,
      depart_time: f.dep,
      arrive_time: f.arr,
      duration: f.dur,
      baggage: f.bag,
      original_price: f.price,
      currency: "CNY",
      internal_supplier_reference: {
        supplier_name: "internal_air",
        supplier_url: "",
        supplier_id: `flt-${toId}-${i}`,
        supplier_price: f.price,
        currency: "CNY",
        internal_notes: `${fromId}-${toId}`
      }
    }));
  }

  window.MOCK_SEARCH = {
    FALLBACK_IMG,
    hotels: mockHotels,
    trains: mockTrains,
    flights: mockFlights,
    HOTEL_SPECS
  };
})();
