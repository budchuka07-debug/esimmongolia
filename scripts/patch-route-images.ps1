# Wikimedia URL → локал зураг солих
$root = Join-Path $PSScriptRoot ".."
$files = Get-ChildItem (Join-Path $root "*-route.html")

$replacements = @{
  # Thailand
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Bangkok_Grand_Palace.jpg/640px-Bangkok_Grand_Palace.jpg" = "/images/routes/thailand/grand-palace.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Wat_Pho_Bangkok.jpg/640px-Wat_Pho_Bangkok.jpg" = "/images/routes/thailand/wat-pho.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chao_Phraya_River_Bangkok.jpg/640px-Chao_Phraya_River_Bangkok.jpg" = "/images/routes/thailand/chao-phraya.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Bangkok_National_Museum.jpg/640px-Bangkok_National_Museum.jpg" = "/images/routes/thailand/national-museum.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Chatuchak_Weekend_Market.jpg/640px-Chatuchak_Weekend_Market.jpg" = "/images/routes/thailand/chatuchak.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Safari_World_Bangkok.jpg/640px-Safari_World_Bangkok.jpg" = "/images/routes/thailand/safari-world.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ayutthaya_Wat_Mahathat.jpg/640px-Ayutthaya_Wat_Mahathat.jpg" = "/images/routes/thailand/ayutthaya-mahathat.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Wat_Chaiwatthanaram%2C_Ayutthaya%2C_Thailand.jpg/640px-Wat_Chaiwatthanaram%2C_Ayutthaya%2C_Thailand.jpg" = "/images/routes/thailand/ayutthaya-chaiwatthanaram.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Bangkok_to_Ayutthaya_train.jpg/640px-Bangkok_to_Ayutthaya_train.jpg" = "/images/routes/thailand/train.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Patong_Beach%2C_Phuket%2C_Thailand.jpg/640px-Patong_Beach%2C_Phuket%2C_Thailand.jpg" = "/images/routes/thailand/patong.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Big_Buddha_Phuket.jpg/640px-Big_Buddha_Phuket.jpg" = "/images/routes/thailand/big-buddha-phuket.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Phuket_Old_Town.jpg/640px-Phuket_Old_Town.jpg" = "/images/routes/thailand/phuket-old-town.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Phi_Phi_Islands.jpg/640px-Phi_Phi_Islands.jpg" = "/images/routes/thailand/phi-phi.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Coral_Island_Phuket.jpg/640px-Coral_Island_Phuket.jpg" = "/images/routes/thailand/coral-island.jpg"
  # Japan
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Sensoji_Temple%2C_Asakusa%2C_Tokyo.jpg/640px-Sensoji_Temple%2C_Asakusa%2C_Tokyo.jpg" = "/images/routes/japan/sensoji.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Tokyo_Skytree_2014_%28cropped%29.jpg/640px-Tokyo_Skytree_2014_%28cropped%29.jpg" = "/images/routes/japan/skytree.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ueno_Zoo_Entrance.jpg/640px-Ueno_Zoo_Entrance.jpg" = "/images/routes/japan/ueno-zoo.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Shibuya_Crossing%2C_Tokyo%2C_Japan.jpg/640px-Shibuya_Crossing%2C_Tokyo%2C_Japan.jpg" = "/images/routes/japan/shibuya.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Meiji_Shrine_Torii.jpg/640px-Meiji_Shrine_Torii.jpg" = "/images/routes/japan/meiji.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/National_Museum_of_Nature_and_Science%2C_Tokyo%2C_Japan.jpg/640px-National_Museum_of_Nature_and_Science%2C_Tokyo%2C_Japan.jpg" = "/images/routes/japan/tokyo-museum.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/0805832-Fuji-from-Yamanakako-2008.jpg/640px-0805832-Fuji-from-Yamanakako-2008.jpg" = "/images/routes/japan/fuji.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Hakone_Ropeway.jpg/640px-Hakone_Ropeway.jpg" = "/images/routes/japan/hakone.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Torii_path_at_Fushimi_Inari_Shrine.JPG/640px-Torii_path_at_Fushimi_Inari_Shrine.JPG" = "/images/routes/japan/fushimi-inari.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kiyomizu-dera%2C_Kyoto%2C_Japan.jpg/640px-Kiyomizu-dera%2C_Kyoto%2C_Japan.jpg" = "/images/routes/japan/kiyomizu.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Kyoto_National_Museum.jpg/640px-Kyoto_National_Museum.jpg" = "/images/routes/japan/kyoto-museum.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Nara_Park_Deer.jpg/640px-Nara_Park_Deer.jpg" = "/images/routes/japan/nara-deer.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Arashiyama_Bamboo_Forest.jpg/640px-Arashiyama_Bamboo_Forest.jpg" = "/images/routes/japan/arashiyama.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Dotonbori_Osaka.jpg/640px-Dotonbori_Osaka.jpg" = "/images/routes/japan/dotonbori.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Osaka_Castle_02.jpg/640px-Osaka_Castle_02.jpg" = "/images/routes/japan/osaka-castle.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kaiyukan_Aquarium_Osaka.jpg/640px-Kaiyukan_Aquarium_Osaka.jpg" = "/images/routes/japan/kaiyukan.jpg"
  # China
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Hohhot_cityscape.jpg/640px-Hohhot_cityscape.jpg" = "/images/routes/china/hohhot.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/CRH_high_speed_train.jpg/640px-CRH_high_speed_train.jpg" = "/images/routes/china/hsr-train.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Forbidden_city_mapotting.jpg/640px-Forbidden_city_mapotting.jpg" = "/images/routes/china/forbidden-city.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Great_Wall_of_China_at_Mutianyu.jpg/640px-Great_Wall_of_China_at_Mutianyu.jpg" = "/images/routes/china/great-wall.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Temple_of_Heaven_1.jpg/640px-Temple_of_Heaven_1.jpg" = "/images/routes/china/temple-of-heaven.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/National_Museum_of_China.jpg/640px-National_Museum_of_China.jpg" = "/images/routes/china/national-museum.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Beijing_Zoo_Panda.jpg/640px-Beijing_Zoo_Panda.jpg" = "/images/routes/china/panda.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tianjin_Eye_and_Haihe_River.jpg/640px-Tianjin_Eye_and_Haihe_River.jpg" = "/images/routes/china/tianjin-eye.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Italian_Style_Street_Tianjin.jpg/640px-Italian_Style_Street_Tianjin.jpg" = "/images/routes/china/tianjin-italian.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Tianjin_Ancient_Culture_Street.jpg/640px-Tianjin_Ancient_Culture_Street.jpg" = "/images/routes/china/tianjin-culture.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/The_Bund%2C_Shanghai.jpg/640px-The_Bund%2C_Shanghai.jpg" = "/images/routes/china/shanghai-bund.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Yu_Garden_Shanghai.jpg/640px-Yu_Garden_Shanghai.jpg" = "/images/routes/china/yu-garden.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Shanghai_Disneyland_Castle.jpg/640px-Shanghai_Disneyland_Castle.jpg" = "/images/routes/china/disneyland.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Shanghai_Museum_exterior.jpg/640px-Shanghai_Museum_exterior.jpg" = "/images/routes/china/shanghai-museum.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Zhujiajiao_water_town.jpg/640px-Zhujiajiao_water_town.jpg" = "/images/routes/china/zhujiajiao.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Canton_Tower_in_Guangzhou.jpg/640px-Canton_Tower_in_Guangzhou.jpg" = "/images/routes/china/canton-tower.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Chen_Clan_Academy_Guangzhou.jpg/640px-Chen_Clan_Academy_Guangzhou.jpg" = "/images/routes/china/chen-clan.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Chimelong_Safari_Park.jpg/640px-Chimelong_Safari_Park.jpg" = "/images/routes/china/chimelong.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Shenzhen_skyline.jpg/640px-Shenzhen_skyline.jpg" = "/images/routes/china/shenzhen.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/OCT_Harbour_Shenzhen.jpg/640px-OCT_Harbour_Shenzhen.jpg" = "/images/routes/china/oct-harbour.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Qingdao_Beach.jpg/640px-Qingdao_Beach.jpg" = "/images/routes/china/qingdao.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Gulangyu_Island_Xiamen.jpg/640px-Gulangyu_Island_Xiamen.jpg" = "/images/routes/china/gulangyu.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sanya_Beach_Hainan.jpg/640px-Sanya_Beach_Hainan.jpg" = "/images/routes/china/sanya.jpg"
  # Korea
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Gyeongbokgung_Palace.jpg/640px-Gyeongbokgung_Palace.jpg" = "/images/routes/korea/gyeongbokgung.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Bukchon_Hanok_Village.jpg/640px-Bukchon_Hanok_Village.jpg" = "/images/routes/korea/bukchon.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/National_Museum_of_Korea.jpg/640px-National_Museum_of_Korea.jpg" = "/images/routes/korea/national-museum.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/N_Seoul_Tower.jpg/640px-N_Seoul_Tower.jpg" = "/images/routes/korea/n-seoul-tower.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Myeongdong_street.jpg/640px-Myeongdong_street.jpg" = "/images/routes/korea/myeongdong.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Everland_Resort.jpg/640px-Everland_Resort.jpg" = "/images/routes/korea/everland.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Seoul_Grand_Park_Zoo.jpg/640px-Seoul_Grand_Park_Zoo.jpg" = "/images/routes/korea/seoul-zoo.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Haeundae_Beach_in_Busan.jpg/640px-Haeundae_Beach_in_Busan.jpg" = "/images/routes/korea/haeundae.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Gamcheon_Culture_Village.jpg/640px-Gamcheon_Culture_Village.jpg" = "/images/routes/korea/gamcheon.jpg"
  # Singapore
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Marina_Bay_Sands_and_Singapore_Skyline.jpg/640px-Marina_Bay_Sands_and_Singapore_Skyline.jpg" = "/images/routes/singapore/marina-bay.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Gardens_by_the_Bay_Supertree_Grove.jpg/640px-Gardens_by_the_Bay_Supertree_Grove.jpg" = "/images/routes/singapore/gardens-bay.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Singapore_Zoo_entrance.jpg/640px-Singapore_Zoo_entrance.jpg" = "/images/routes/singapore/zoo.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Universal_Studios_Singapore_entrance.jpg/640px-Universal_Studios_Singapore_entrance.jpg" = "/images/routes/singapore/uss.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chinatown_Singapore.jpg/640px-Chinatown_Singapore.jpg" = "/images/routes/singapore/chinatown.jpg"
  # Hong Kong
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Hong_Kong_Skyline_view_from_the_Peak_2017.jpg/640px-Hong_Kong_Skyline_view_from_the_Peak_2017.jpg" = "/images/routes/hongkong/victoria-peak.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Hong_Kong_Disneyland_Castle.jpg/640px-Hong_Kong_Disneyland_Castle.jpg" = "/images/routes/hongkong/disneyland.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ocean_Park_Hong_Kong.jpg/640px-Ocean_Park_Hong_Kong.jpg" = "/images/routes/hongkong/ocean-park.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tian_Tan_Buddha_2010.jpg/640px-Tian_Tan_Buddha_2010.jpg" = "/images/routes/hongkong/big-buddha.jpg"
  # Malaysia
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Petronas_Twin_Towers_2010.jpg/640px-Petronas_Twin_Towers_2010.jpg" = "/images/routes/malaysia/petronas.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Batu_Caves_Malaysia.jpg/640px-Batu_Caves_Malaysia.jpg" = "/images/routes/malaysia/batu-caves.jpg"
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/George_Town_Penang_street_art.jpg/640px-George_Town_Penang_street_art.jpg" = "/images/routes/malaysia/penang.jpg"
}

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  $changed = $false
  foreach ($kv in $replacements.GetEnumerator()) {
    if ($content.Contains($kv.Key)) {
      $content = $content.Replace($kv.Key, $kv.Value)
      $changed = $true
    }
  }
  # onerror hide — локал зурагт хэрэггүй
  $content = $content -replace '\s*onerror="this\.style\.display=''none''"', ''
  if ($changed) {
    Set-Content $file.FullName $content -Encoding UTF8 -NoNewline
    Write-Host "Updated $($file.Name)"
  }
}
