$pex = "https://images.pexels.com/photos/{0}/pexels-photo-{0}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
$root = Join-Path $PSScriptRoot "..\images\routes"
$items = @(
  @{ dir="vietnam"; file="hanoi.jpg"; id=2387866 },
  @{ dir="vietnam"; file="halong.jpg"; id=892655 },
  @{ dir="vietnam"; file="danang.jpg"; id=753619 },
  @{ dir="vietnam"; file="hoian.jpg"; id=1450353 },
  @{ dir="vietnam"; file="hcmc.jpg"; id=3180081 },
  @{ dir="taiwan"; file="taipei101.jpg"; id=2506923 },
  @{ dir="taiwan"; file="jiufen.jpg"; id=1613970 },
  @{ dir="taiwan"; file="sunmoon.jpg"; id=1613970 },
  @{ dir="philippines"; file="manila.jpg"; id=2387866 },
  @{ dir="philippines"; file="cebu.jpg"; id=753619 },
  @{ dir="philippines"; file="palawan.jpg"; id=892655 },
  @{ dir="philippines"; file="boracay.jpg"; id=1450353 },
  @{ dir="turkey"; file="istanbul.jpg"; id=2387866 },
  @{ dir="turkey"; file="cappadocia.jpg"; id=1613970 },
  @{ dir="turkey"; file="antalya.jpg"; id=753619 },
  @{ dir="indonesia"; file="bali.jpg"; id=753619 },
  @{ dir="indonesia"; file="ubud.jpg"; id=1613970 },
  @{ dir="indonesia"; file="uluwatu.jpg"; id=3148452 }
)
foreach ($item in $items) {
  $dir = Join-Path $root $item.dir
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $out = Join-Path $dir $item.file
  try { Invoke-WebRequest -Uri ($pex -f $item.id) -OutFile $out -UseBasicParsing -TimeoutSec 60 } catch {}
}
