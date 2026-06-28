/**
 * China hotel areas — keyed by city_id (merged into HOTEL_AREAS on load)
 */
(function () {
  function a(id, name, district, opts) {
    const o = opts || {};
    return {
      id,
      name,
      district,
      landmarks: o.landmarks || [name],
      nearby_metro: o.metro || "",
      latitude: o.lat || 0,
      longitude: o.lng || 0,
      distance_to_center_km: o.dist_center_km ?? 2,
      distance_to_airport_km: o.dist_airport_km ?? 25,
      aliases: o.aliases || []
    };
  }

  const CHINA_HOTEL_AREAS = {
    guangzhou: [
      a("tianhe", "Tianhe", "Tianhe", { metro: "Tianhe Sports Center", lat: 23.1378, lng: 113.3309, dist_center_km: 2, dist_airport_km: 35, landmarks: ["Canton Tower", "Tianhe CBD"] }),
      a("zhujiang", "Zhujiang New Town", "Tianhe", { metro: "Zhujiang New Town", lat: 23.1193, lng: 113.3212, dist_center_km: 3, dist_airport_km: 34, landmarks: ["Canton Tower", "Opera House"] }),
      a("beijing_road", "Beijing Road", "Yuexiu", { metro: "Gongyuanqian", lat: 23.1256, lng: 113.2644, dist_center_km: 0.8, dist_airport_km: 32, landmarks: ["Beijing Road Pedestrian Street"] }),
      a("shamian", "Shamian Island", "Liwan", { metro: "Huangsha", lat: 23.1078, lng: 113.2431, dist_center_km: 4, dist_airport_km: 36, landmarks: ["Shamian Island", "Colonial architecture"] }),
      a("pazhou", "Pazhou", "Haizhu", { metro: "Pazhou", lat: 23.0989, lng: 113.3612, dist_center_km: 6, dist_airport_km: 38, landmarks: ["Canton Fair Complex"] }),
      a("guangzhou_south", "Guangzhou South HSR", "Panyu", { metro: "Guangzhou South Railway Station", lat: 22.9903, lng: 113.2690, dist_center_km: 12, dist_airport_km: 42, landmarks: ["Guangzhou South Station"] }),
      a("baiyun_airport", "Baiyun Airport", "Baiyun", { metro: "Airport South", lat: 23.3924, lng: 113.2988, dist_center_km: 28, dist_airport_km: 1, landmarks: ["CAN Airport"] }),
      a("chen_clan", "Chen Clan Academy", "Liwan", { metro: "Chen Clan Academy", lat: 23.1278, lng: 113.2436, dist_center_km: 3.5, dist_airport_km: 33, landmarks: ["Chen Clan Academy"] })
    ],

    shenzhen: [
      a("futian", "Futian CBD", "Futian", { metro: "Convention & Exhibition Center", lat: 22.5347, lng: 114.0612, dist_center_km: 1, dist_airport_km: 32, landmarks: ["Futian CBD", "Ping An Finance Centre"] }),
      a("luohu", "Luohu", "Luohu", { metro: "Luohu", lat: 22.5329, lng: 114.1183, dist_center_km: 2, dist_airport_km: 40, landmarks: ["Luohu Port", "Hong Kong border"] }),
      a("nanshan", "Nanshan", "Nanshan", { metro: "Hi-Tech Park", lat: 22.5405, lng: 113.9344, dist_center_km: 8, dist_airport_km: 18, landmarks: ["Tencent HQ area", "OCT Harbour"] }),
      a("oct", "OCT Harbour", "Nanshan", { metro: "Window of the World", lat: 22.5367, lng: 113.9734, dist_center_km: 7, dist_airport_km: 20, landmarks: ["OCT Harbour", "Window of the World"] }),
      a("shekou", "Shekou", "Nanshan", { metro: "Shekou Port", lat: 22.4889, lng: 113.9123, dist_center_km: 10, dist_airport_km: 25, landmarks: ["Sea World", "Shekou"] }),
      a("shenzhen_north", "Shenzhen North HSR", "Longhua", { metro: "Shenzhen North", lat: 22.6097, lng: 114.0294, dist_center_km: 8, dist_airport_km: 28, landmarks: ["Shenzhen North Station"] }),
      a("baoan_airport", "Bao'an Airport", "Bao'an", { metro: "Airport East", lat: 22.6393, lng: 113.8106, dist_center_km: 25, dist_airport_km: 1, landmarks: ["SZX Airport"] }),
      a("longgang", "Longgang", "Longgang", { metro: "Longgang", lat: 22.7215, lng: 114.2478, dist_center_km: 15, dist_airport_km: 35, landmarks: ["Longgang CBD"] })
    ],

    chengdu: [
      a("tianfu_square", "Tianfu Square", "Qingyang", { metro: "Tianfu Square", lat: 30.6598, lng: 104.0657, dist_center_km: 0.5, dist_airport_km: 18, landmarks: ["Tianfu Square", "People's Park"] }),
      a("jinli", "Jinli Street", "Wuhou", { metro: "Wuhouci", lat: 30.6456, lng: 104.0498, dist_center_km: 2, dist_airport_km: 19, landmarks: ["Jinli Ancient Street", "Wuhou Shrine"] }),
      a("chunxi", "Chunxi Road", "Jinjiang", { metro: "Chunxi Road", lat: 30.6578, lng: 104.0812, dist_center_km: 1, dist_airport_km: 17, landmarks: ["Chunxi Road shopping"] }),
      a("panda_base", "Panda Base Area", "Chenghua", { metro: "Chengdu Zoo", lat: 30.7345, lng: 104.1423, dist_center_km: 8, dist_airport_km: 22, landmarks: ["Giant Panda Base"] }),
      a("chengdu_east", "Chengdu East HSR", "Chenghua", { metro: "Chengdu East Railway Station", lat: 30.6289, lng: 104.1412, dist_center_km: 6, dist_airport_km: 20, landmarks: ["Chengdu East Station"] }),
      a("tianfu_airport", "Tianfu Airport", "Jianyang", { metro: "", lat: 30.3198, lng: 104.4412, dist_center_km: 45, dist_airport_km: 1, landmarks: ["TFU Airport"] }),
      a("wide_narrow", "Wide and Narrow Alleys", "Qingyang", { metro: "People's Park", lat: 30.6678, lng: 104.0534, dist_center_km: 1.5, dist_airport_km: 18, landmarks: ["Kuanzhai Alley"] }),
      a("hi_tech", "Hi-Tech Zone", "Wuhou", { metro: "Tianfu Third Street", lat: 30.5412, lng: 104.0623, dist_center_km: 5, dist_airport_km: 15, landmarks: ["Software Park"] })
    ],

    yiwu: [
      a("trade_city", "International Trade City", "Yiwu", { metro: "", lat: 29.3067, lng: 120.0756, dist_center_km: 3, dist_airport_km: 12, landmarks: ["Yiwu Trade City District 1"] }),
      a("futian", "Futian Market", "Yiwu", { metro: "", lat: 29.3123, lng: 120.0812, dist_center_km: 3.5, dist_airport_km: 11, landmarks: ["Futian Market"] }),
      a("yiwu_center", "Yiwu City Center", "Yiwu", { metro: "", lat: 29.3089, lng: 120.0745, dist_center_km: 0.5, dist_airport_km: 10, landmarks: ["Xiuhu Square"] }),
      a("yiwu_railway", "Yiwu Railway Station", "Yiwu", { metro: "", lat: 29.3456, lng: 120.0623, dist_center_km: 5, dist_airport_km: 8, landmarks: ["Yiwu HSR Station"] }),
      a("yiwu_airport", "Yiwu Airport", "Yiwu", { metro: "", lat: 29.3445, lng: 120.0312, dist_center_km: 8, dist_airport_km: 1, landmarks: ["YIW Airport"] }),
      a("beiyuan", "Beiyuan", "Yiwu", { metro: "", lat: 29.3234, lng: 120.0534, dist_center_km: 2, dist_airport_km: 9, landmarks: ["Beiyuan wholesale"] })
    ],

    harbin: [
      a("central_street", "Central Street", "Daoli", { metro: "Central Street", lat: 45.7734, lng: 126.6234, dist_center_km: 0.5, dist_airport_km: 38, landmarks: ["Zhongyang Street", "Saint Sophia"] }),
      a("ice_festival", "Ice Festival Area", "Songbei", { metro: "Ice & Snow World", lat: 45.8012, lng: 126.5623, dist_center_km: 5, dist_airport_km: 35, landmarks: ["Harbin Ice Festival"] }),
      a("sun_island", "Sun Island", "Songbei", { metro: "Sun Island", lat: 45.7912, lng: 126.5912, dist_center_km: 4, dist_airport_km: 36, landmarks: ["Sun Island Scenic Area"] }),
      a("harbin_west", "Harbin West HSR", "Nangang", { metro: "Harbin West Railway Station", lat: 45.7123, lng: 126.5812, dist_center_km: 8, dist_airport_km: 42, landmarks: ["Harbin West Station"] }),
      a("harbin_airport", "Taiping Airport", "Daoli", { metro: "", lat: 45.6234, lng: 126.2434, dist_center_km: 35, dist_airport_km: 1, landmarks: ["HRB Airport"] }),
      a("tiger_park", "Siberian Tiger Park", "Songbei", { metro: "", lat: 45.8234, lng: 126.6012, dist_center_km: 6, dist_airport_km: 34, landmarks: ["Siberian Tiger Park"] })
    ],

    xian: [
      a("bell_tower", "Bell Tower", "Beilin", { metro: "Bell Tower", lat: 34.2612, lng: 108.9423, dist_center_km: 0.3, dist_airport_km: 35, landmarks: ["Bell Tower", "Drum Tower"] }),
      a("muslim_quarter", "Muslim Quarter", "Lianhu", { metro: "Bell Tower", lat: 34.2645, lng: 108.9389, dist_center_km: 0.8, dist_airport_km: 35, landmarks: ["Muslim Quarter", "Great Mosque"] }),
      a("city_wall", "City Wall South Gate", "Beilin", { metro: "Yongningmen", lat: 34.2512, lng: 108.9467, dist_center_km: 1.5, dist_airport_km: 36, landmarks: ["Ancient City Wall"] }),
      a("big_wild_goose", "Big Wild Goose Pagoda", "Yanta", { metro: "Dayanta", lat: 34.2189, lng: 108.9645, dist_center_km: 4, dist_airport_km: 38, landmarks: ["Big Wild Goose Pagoda"] }),
      a("xian_north", "Xi'an North HSR", "Weiyang", { metro: "Beikezhan", lat: 34.3778, lng: 108.9389, dist_center_km: 12, dist_airport_km: 30, landmarks: ["Xi'an North Station"] }),
      a("xianyang_airport", "Xianyang Airport", "Weicheng", { metro: "", lat: 34.4478, lng: 108.7512, dist_center_km: 30, dist_airport_km: 1, landmarks: ["XIY Airport"] }),
      a("terracotta", "Terracotta Army Area", "Lintong", { metro: "", lat: 34.3845, lng: 109.2789, dist_center_km: 35, dist_airport_km: 25, landmarks: ["Terracotta Warriors"] })
    ],

    dalian: [
      a("xinghai", "Xinghai Square", "Shahekou", { metro: "Xinghai Square", lat: 38.8789, lng: 121.5812, dist_center_km: 3, dist_airport_km: 12, landmarks: ["Xinghai Square", "Xinghai Bay"] }),
      a("zhongshan", "Zhongshan Square", "Zhongshan", { metro: "Friendship Square", lat: 38.9189, lng: 121.6445, dist_center_km: 0.5, dist_airport_km: 15, landmarks: ["Zhongshan Square"] }),
      a("tiger_beach", "Tiger Beach", "Zhongshan", { metro: "", lat: 38.8712, lng: 121.6812, dist_center_km: 5, dist_airport_km: 18, landmarks: ["Tiger Beach Ocean Park"] }),
      a("dalian_north", "Dalian North HSR", "Ganjingzi", { metro: "Dalian North Railway Station", lat: 39.0234, lng: 121.6012, dist_center_km: 12, dist_airport_km: 8, landmarks: ["Dalian North Station"] }),
      a("dalian_airport", "Zhoushuizi Airport", "Ganjingzi", { metro: "", lat: 38.9656, lng: 121.5389, dist_center_km: 10, dist_airport_km: 1, landmarks: ["DLC Airport"] }),
      a("russian_street", "Russian Street", "Xigang", { metro: "Qingniwaqiao", lat: 38.9234, lng: 121.6312, dist_center_km: 1.5, dist_airport_km: 14, landmarks: ["Russian Street"] })
    ],

    hangzhou: [
      a("west_lake", "West Lake", "Xihu", { metro: "Longxiangqiao", lat: 30.2501, lng: 120.1551, dist_center_km: 0.5, dist_airport_km: 28, landmarks: ["West Lake", "Broken Bridge"] }),
      a("lingyin", "Lingyin Temple", "Xihu", { metro: "Fengqi Road", lat: 30.2412, lng: 120.1012, dist_center_km: 4, dist_airport_km: 30, landmarks: ["Lingyin Temple", "Feilai Peak"] }),
      a("qianjiang", "Qianjiang CBD", "Shangcheng", { metro: "Citizen Center", lat: 30.2512, lng: 120.2123, dist_center_km: 3, dist_airport_km: 26, landmarks: ["Qianjiang New City"] }),
      a("hangzhou_east", "Hangzhou East HSR", "Shangcheng", { metro: "East Railway Station", lat: 30.2934, lng: 120.2123, dist_center_km: 5, dist_airport_km: 25, landmarks: ["Hangzhou East Station"] }),
      a("longjing", "Longjing Village", "Xihu", { metro: "", lat: 30.2234, lng: 120.1089, dist_center_km: 6, dist_airport_km: 32, landmarks: ["Longjing Tea Plantations"] }),
      a("xiaoshan_airport", "Xiaoshan Airport", "Xiaoshan", { metro: "", lat: 30.2295, lng: 120.4344, dist_center_km: 25, dist_airport_km: 1, landmarks: ["HGH Airport"] }),
      a("hefang", "Hefang Street", "Shangcheng", { metro: "Ding'an Road", lat: 30.2412, lng: 120.1689, dist_center_km: 1, dist_airport_km: 28, landmarks: ["Hefang Ancient Street"] })
    ],

    suzhou: [
      a("pingjiang", "Pingjiang Road", "Gusu", { metro: "Xiangmen", lat: 31.3123, lng: 120.6312, dist_center_km: 0.8, dist_airport_km: 65, landmarks: ["Pingjiang Historic Street"] }),
      a("humble_garden", "Humble Administrator's Garden", "Gusu", { metro: "North Temple Tower", lat: 31.3234, lng: 120.6289, dist_center_km: 1.5, dist_airport_km: 64, landmarks: ["Humble Administrator's Garden"] }),
      a("jinji_lake", "Jinji Lake", "SIP", { metro: "Culture & Expo Center", lat: 31.3189, lng: 120.7012, dist_center_km: 4, dist_airport_km: 60, landmarks: ["Jinji Lake", "Suzhou Center"] }),
      a("tiger_hill", "Tiger Hill", "Gusu", { metro: "", lat: 31.3312, lng: 120.5912, dist_center_km: 3, dist_airport_km: 66, landmarks: ["Tiger Hill"] }),
      a("suzhou_north", "Suzhou North HSR", "Xiangcheng", { metro: "Suzhou North Railway Station", lat: 31.4212, lng: 120.6389, dist_center_km: 12, dist_airport_km: 55, landmarks: ["Suzhou North Station"] }),
      a("guanqian", "Guanqian Street", "Gusu", { metro: "Leqiao", lat: 31.3089, lng: 120.6212, dist_center_km: 1, dist_airport_km: 65, landmarks: ["Guanqian Shopping Street"] })
    ],

    nanjing: [
      a("xuanwu_lake", "Xuanwu Lake", "Xuanwu", { metro: "Xuanwumen", lat: 32.0712, lng: 118.7989, dist_center_km: 1, dist_airport_km: 38, landmarks: ["Xuanwu Lake", "City Wall"] }),
      a("confucius_temple", "Confucius Temple", "Qinhuai", { metro: "Sanshanjie", lat: 32.0212, lng: 118.7912, dist_center_km: 2, dist_airport_km: 40, landmarks: ["Confucius Temple", "Qinhuai River"] }),
      a("sun_yat_sen", "Sun Yat-sen Mausoleum", "Xuanwu", { metro: "Ming Xiaoling Mausoleum", lat: 32.0589, lng: 118.8512, dist_center_km: 5, dist_airport_km: 35, landmarks: ["Sun Yat-sen Mausoleum", "Purple Mountain"] }),
      a("nanjing_south", "Nanjing South HSR", "Yuhuatai", { metro: "Nanjing South Railway Station", lat: 31.9712, lng: 118.7989, dist_center_km: 8, dist_airport_km: 32, landmarks: ["Nanjing South Station"] }),
      a("lukou_airport", "Lukou Airport", "Jiangning", { metro: "Lukou Airport", lat: 31.7423, lng: 118.8623, dist_center_km: 30, dist_airport_km: 1, landmarks: ["NKG Airport"] }),
      a("xinjiekou", "Xinjiekou", "Xuanwu", { metro: "Xinjiekou", lat: 32.0412, lng: 118.7889, dist_center_km: 0.5, dist_airport_km: 39, landmarks: ["Xinjiekou CBD"] })
    ],

    qingdao: [
      a("zhanqiao", "Zhanqiao Pier", "Shinan", { metro: "Qingdao Railway Station", lat: 36.0612, lng: 120.3189, dist_center_km: 0.5, dist_airport_km: 35, landmarks: ["Zhanqiao Pier", "Badaguan"] }),
      a("badaguan", "Badaguan", "Shinan", { metro: "", lat: 36.0512, lng: 120.3512, dist_center_km: 3, dist_airport_km: 38, landmarks: ["Badaguan Scenic Area"] }),
      a("tsingtao", "Tsingtao Brewery", "Shibei", { metro: "Taidong", lat: 36.0812, lng: 120.3412, dist_center_km: 2, dist_airport_km: 33, landmarks: ["Tsingtao Beer Museum"] }),
      a("laoshan", "Laoshan", "Laoshan", { metro: "", lat: 36.1912, lng: 120.6012, dist_center_km: 25, dist_airport_km: 45, landmarks: ["Laoshan Mountain"] }),
      a("jiaodong_airport", "Jiaodong Airport", "Jiaozhou", { metro: "", lat: 36.2667, lng: 120.0012, dist_center_km: 45, dist_airport_km: 1, landmarks: ["TAO Airport"] }),
      a("may_fourth", "May Fourth Square", "Shinan", { metro: "Wusi Square", lat: 36.0612, lng: 120.3889, dist_center_km: 2, dist_airport_km: 36, landmarks: ["May Fourth Square"] })
    ],

    xiamen: [
      a("zhongshan", "Zhongshan Road", "Siming", { metro: "Zhenhai Road", lat: 24.4512, lng: 118.0812, dist_center_km: 0.5, dist_airport_km: 12, landmarks: ["Zhongshan Road"] }),
      a("gulangyu", "Gulangyu Ferry", "Siming", { metro: "Lujiang", lat: 24.4489, lng: 118.0712, dist_center_km: 1, dist_airport_km: 13, landmarks: ["Gulangyu Island ferry"] }),
      a("nanputuo", "Nanputuo Temple", "Siming", { metro: "University Town", lat: 24.4412, lng: 118.1012, dist_center_km: 2, dist_airport_km: 14, landmarks: ["Nanputuo Temple", "Xiamen University"] }),
      a("xiamen_north", "Xiamen North HSR", "Jimei", { metro: "Xiamen North Railway Station", lat: 24.6312, lng: 118.0712, dist_center_km: 15, dist_airport_km: 8, landmarks: ["Xiamen North Station"] }),
      a("gaoqi_airport", "Gaoqi Airport", "Huli", { metro: "", lat: 24.5445, lng: 118.1278, dist_center_km: 10, dist_airport_km: 1, landmarks: ["XMN Airport"] }),
      a("huandao", "Island Ring Road", "Siming", { metro: "", lat: 24.4312, lng: 118.1212, dist_center_km: 3, dist_airport_km: 15, landmarks: ["Huandao Road beach"] })
    ],

    kunming: [
      a("green_lake", "Green Lake Park", "Wuhua", { metro: "Panlong Temple", lat: 25.0512, lng: 102.7012, dist_center_km: 0.5, dist_airport_km: 28, landmarks: ["Green Lake Park"] }),
      a("dianchi", "Dianchi Lake", "Xishan", { metro: "", lat: 24.9612, lng: 102.6512, dist_center_km: 8, dist_airport_km: 35, landmarks: ["Dianchi Lake", "Western Hills"] }),
      a("kunming_south", "Kunming South HSR", "Chenggong", { metro: "Kunming South Railway Station", lat: 24.8812, lng: 102.8212, dist_center_km: 18, dist_airport_km: 20, landmarks: ["Kunming South Station"] }),
      a("changshui_airport", "Changshui Airport", "Guandu", { metro: "Kunming Airport", lat: 25.1012, lng: 102.9312, dist_center_km: 25, dist_airport_km: 1, landmarks: ["KMG Airport"] }),
      a("jinma", "Jinma Biji", "Panlong", { metro: "Dongfeng Square", lat: 25.0412, lng: 102.7112, dist_center_km: 1, dist_airport_km: 27, landmarks: ["Jinma Biji Archways"] }),
      a("stone_forest", "Stone Forest Area", "Shilin", { metro: "", lat: 24.8212, lng: 103.3312, dist_center_km: 80, dist_airport_km: 70, landmarks: ["Stone Forest"] })
    ],

    wuhan: [
      a("yellow_crane", "Yellow Crane Tower", "Wuchang", { metro: "Crane Tower", lat: 30.5412, lng: 114.3012, dist_center_km: 2, dist_airport_km: 35, landmarks: ["Yellow Crane Tower"] }),
      a("hubuxiang", "Hubuxiang Alley", "Wuchang", { metro: "Crane Tower", lat: 30.5489, lng: 114.2989, dist_center_km: 2.5, dist_airport_km: 36, landmarks: ["Hubuxiang food street"] }),
      a("east_lake", "East Lake", "Wuchang", { metro: "Chu River Han Street", lat: 30.5612, lng: 114.3712, dist_center_km: 5, dist_airport_km: 38, landmarks: ["East Lake Scenic Area"] }),
      a("jianghan", "Jianghan Road", "Jianghan", { metro: "Jianghan Road", lat: 30.5812, lng: 114.2912, dist_center_km: 1, dist_airport_km: 34, landmarks: ["Jianghan Road Pedestrian Street"] }),
      a("tianhe_airport", "Tianhe Airport", "Huangpi", { metro: "", lat: 30.7834, lng: 114.2089, dist_center_km: 30, dist_airport_km: 1, landmarks: ["WUH Airport"] }),
      a("wuhan_railway", "Wuhan Railway Station", "Hongshan", { metro: "Wuhan Railway Station", lat: 30.6012, lng: 114.4212, dist_center_km: 8, dist_airport_km: 40, landmarks: ["Wuhan HSR Hub"] })
    ],

    changsha: [
      a("orange_isle", "Orange Isle", "Yuelu", { metro: "Juzizhou", lat: 28.1912, lng: 112.9612, dist_center_km: 2, dist_airport_km: 28, landmarks: ["Orange Isle", "Xiang River"] }),
      a("yuelu", "Yuelu Mountain", "Yuelu", { metro: "Hunan University", lat: 28.1812, lng: 112.9412, dist_center_km: 4, dist_airport_km: 30, landmarks: ["Yuelu Academy", "Yuelu Mountain"] }),
      a("huangxing", "Huangxing Road", "Tianxin", { metro: "Huangxing Square", lat: 28.1912, lng: 112.9812, dist_center_km: 0.5, dist_airport_km: 27, landmarks: ["Huangxing Pedestrian Street"] }),
      a("changsha_south", "Changsha South HSR", "Yuhua", { metro: "Changsha South Railway Station", lat: 28.1512, lng: 113.0612, dist_center_km: 8, dist_airport_km: 25, landmarks: ["Changsha South Station"] }),
      a("huanghua_airport", "Huanghua Airport", "Changsha County", { metro: "Huanghua Airport", lat: 28.1912, lng: 113.2212, dist_center_km: 22, dist_airport_km: 1, landmarks: ["CSX Airport"] }),
      a("hunan_museum", "Hunan Museum", "Kaifu", { metro: "Wenyi Road", lat: 28.2112, lng: 112.9912, dist_center_km: 2, dist_airport_km: 28, landmarks: ["Hunan Provincial Museum"] })
    ],

    zhangjiajie: [
      a("wulingyuan", "Wulingyuan", "Wulingyuan", { metro: "", lat: 29.3512, lng: 110.5512, dist_center_km: 30, dist_airport_km: 35, landmarks: ["Zhangjiajie National Forest Park"] }),
      a("tianmen", "Tianmen Mountain", "Yongding", { metro: "", lat: 29.1212, lng: 110.4812, dist_center_km: 2, dist_airport_km: 8, landmarks: ["Tianmen Mountain", "Glass skywalk"] }),
      a("zjj_downtown", "Zhangjiajie Downtown", "Yongding", { metro: "", lat: 29.1212, lng: 110.4712, dist_center_km: 0.5, dist_airport_km: 7, landmarks: ["Zhangjiajie City"] }),
      a("zjj_airport", "Hehua Airport", "Yongding", { metro: "", lat: 29.1089, lng: 110.4512, dist_center_km: 5, dist_airport_km: 1, landmarks: ["DYG Airport"] }),
      a("zjj_west", "Zhangjiajie West HSR", "Yongding", { metro: "", lat: 29.1412, lng: 110.5212, dist_center_km: 4, dist_airport_km: 10, landmarks: ["Zhangjiajie West Station"] }),
      a("baofeng", "Baofeng Lake", "Wulingyuan", { metro: "", lat: 29.3612, lng: 110.5712, dist_center_km: 32, dist_airport_km: 38, landmarks: ["Baofeng Lake"] })
    ],

    sanya: [
      a("yalong", "Yalong Bay", "Jiyang", { metro: "", lat: 18.2312, lng: 109.6512, dist_center_km: 25, dist_airport_km: 30, landmarks: ["Yalong Bay Beach"] }),
      a("dadonghai", "Dadonghai", "Jiyang", { metro: "", lat: 18.2212, lng: 109.5112, dist_center_km: 3, dist_airport_km: 18, landmarks: ["Dadonghai Beach"] }),
      a("sanya_bay", "Sanya Bay", "Tianya", { metro: "", lat: 18.2512, lng: 109.4812, dist_center_km: 5, dist_airport_km: 12, landmarks: ["Sanya Bay", "Coconut Dream Corridor"] }),
      a("nanshan", "Nanshan Temple", "Yazhou", { metro: "", lat: 18.2912, lng: 109.2012, dist_center_km: 35, dist_airport_km: 40, landmarks: ["Nanshan Buddhist Temple"] }),
      a("phoenix_airport", "Phoenix Airport", "Tianya", { metro: "", lat: 18.3012, lng: 109.4112, dist_center_km: 12, dist_airport_km: 1, landmarks: ["SYX Airport"] }),
      a("wuzhizhou", "Wuzhizhou Island Pier", "Haitang", { metro: "", lat: 18.3112, lng: 109.7612, dist_center_km: 28, dist_airport_km: 35, landmarks: ["Wuzhizhou Island"] })
    ]
  };

  if (window.HOTEL_AREAS?.CITY_AREAS) {
    Object.assign(window.HOTEL_AREAS.CITY_AREAS, CHINA_HOTEL_AREAS);
  }

  window.CHINA_HOTEL_AREAS = CHINA_HOTEL_AREAS;
})();
