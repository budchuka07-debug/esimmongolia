# Pexels зургууд — үнэгүй, лого/усны тэмдэггүй (Pexels License)
$pex = "https://images.pexels.com/photos/{0}/pexels-photo-{0}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
$root = Join-Path $PSScriptRoot "..\images\routes"

$items = @(
  @{ dir="thailand"; file="grand-palace.jpg"; id=3724434 },
  @{ dir="thailand"; file="wat-pho.jpg"; id=3148452 },
  @{ dir="thailand"; file="chao-phraya.jpg"; id=3180081 },
  @{ dir="thailand"; file="national-museum.jpg"; id=3601428 },
  @{ dir="thailand"; file="chatuchak.jpg"; id=30339581 },
  @{ dir="thailand"; file="safari-world.jpg"; id=1174732 },
  @{ dir="thailand"; file="ayutthaya-mahathat.jpg"; id=3724434 },
  @{ dir="thailand"; file="ayutthaya-chaiwatthanaram.jpg"; id=3148452 },
  @{ dir="thailand"; file="train.jpg"; id=1450360 },
  @{ dir="thailand"; file="patong.jpg"; id=753619 },
  @{ dir="thailand"; file="big-buddha-phuket.jpg"; id=3148452 },
  @{ dir="thailand"; file="phuket-old-town.jpg"; id=3180081 },
  @{ dir="thailand"; file="phi-phi.jpg"; id=892655 },
  @{ dir="thailand"; file="coral-island.jpg"; id=1450353 },
  @{ dir="china"; file="hohhot.jpg"; id=2387866 },
  @{ dir="china"; file="hsr-train.jpg"; id=1450360 },
  @{ dir="china"; file="forbidden-city.jpg"; id=6427087 },
  @{ dir="china"; file="great-wall.jpg"; id=6427087 },
  @{ dir="china"; file="temple-of-heaven.jpg"; id=2387866 },
  @{ dir="china"; file="national-museum.jpg"; id=3601428 },
  @{ dir="china"; file="panda.jpg"; id=145939 },
  @{ dir="china"; file="tianjin-eye.jpg"; id=2387866 },
  @{ dir="china"; file="tianjin-italian.jpg"; id=2574894 },
  @{ dir="china"; file="tianjin-culture.jpg"; id=2387866 },
  @{ dir="china"; file="shanghai-bund.jpg"; id=2574894 },
  @{ dir="china"; file="yu-garden.jpg"; id=2574894 },
  @{ dir="china"; file="disneyland.jpg"; id=33153 },
  @{ dir="china"; file="shanghai-museum.jpg"; id=2574894 },
  @{ dir="china"; file="zhujiajiao.jpg"; id=2574894 },
  @{ dir="china"; file="canton-tower.jpg"; id=2387866 },
  @{ dir="china"; file="chen-clan.jpg"; id=2574894 },
  @{ dir="china"; file="chimelong.jpg"; id=1174732 },
  @{ dir="china"; file="shenzhen.jpg"; id=2387866 },
  @{ dir="china"; file="oct-harbour.jpg"; id=2574894 },
  @{ dir="china"; file="qingdao.jpg"; id=753619 },
  @{ dir="china"; file="gulangyu.jpg"; id=892655 },
  @{ dir="china"; file="sanya.jpg"; id=1450353 },
  @{ dir="japan"; file="sensoji.jpg"; id=2506923 },
  @{ dir="japan"; file="skytree.jpg"; id=2506923 },
  @{ dir="japan"; file="ueno-zoo.jpg"; id=1174732 },
  @{ dir="japan"; file="shibuya.jpg"; id=2506923 },
  @{ dir="japan"; file="meiji.jpg"; id=1613970 },
  @{ dir="japan"; file="tokyo-museum.jpg"; id=2506923 },
  @{ dir="japan"; file="fuji.jpg"; id=1613970 },
  @{ dir="japan"; file="hakone.jpg"; id=1613970 },
  @{ dir="japan"; file="fushimi-inari.jpg"; id=1613970 },
  @{ dir="japan"; file="kiyomizu.jpg"; id=1613970 },
  @{ dir="japan"; file="kyoto-museum.jpg"; id=1613970 },
  @{ dir="japan"; file="nara-deer.jpg"; id=1613970 },
  @{ dir="japan"; file="arashiyama.jpg"; id=1613970 },
  @{ dir="japan"; file="dotonbori.jpg"; id=2506923 },
  @{ dir="japan"; file="osaka-castle.jpg"; id=2506923 },
  @{ dir="japan"; file="kaiyukan.jpg"; id=1174732 },
  @{ dir="korea"; file="gyeongbokgung.jpg"; id=1365425 },
  @{ dir="korea"; file="bukchon.jpg"; id=1365425 },
  @{ dir="korea"; file="national-museum.jpg"; id=1365425 },
  @{ dir="korea"; file="n-seoul-tower.jpg"; id=1365425 },
  @{ dir="korea"; file="myeongdong.jpg"; id=1365425 },
  @{ dir="korea"; file="everland.jpg"; id=33153 },
  @{ dir="korea"; file="seoul-zoo.jpg"; id=1174732 },
  @{ dir="korea"; file="haeundae.jpg"; id=753619 },
  @{ dir="korea"; file="gamcheon.jpg"; id=1365425 },
  @{ dir="singapore"; file="marina-bay.jpg"; id=1200450 },
  @{ dir="singapore"; file="gardens-bay.jpg"; id=1200450 },
  @{ dir="singapore"; file="zoo.jpg"; id=1174732 },
  @{ dir="singapore"; file="uss.jpg"; id=33153 },
  @{ dir="singapore"; file="chinatown.jpg"; id=1200450 },
  @{ dir="hongkong"; file="victoria-peak.jpg"; id=1533661 },
  @{ dir="hongkong"; file="disneyland.jpg"; id=33153 },
  @{ dir="hongkong"; file="ocean-park.jpg"; id=1174732 },
  @{ dir="hongkong"; file="big-buddha.jpg"; id=3148452 },
  @{ dir="malaysia"; file="petronas.jpg"; id=2034332 },
  @{ dir="malaysia"; file="batu-caves.jpg"; id=2034332 },
  @{ dir="malaysia"; file="penang.jpg"; id=2034332 }
)

$ok = 0; $fail = 0
foreach ($item in $items) {
  $dir = Join-Path $root $item.dir
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $out = Join-Path $dir $item.file
  $url = $pex -f $item.id
  try {
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 60
    if ((Get-Item $out).Length -gt 5000) { $ok++ } else { $fail++ }
  } catch { $fail++ }
}
Write-Host "Pexels: $ok ok, $fail failed"
