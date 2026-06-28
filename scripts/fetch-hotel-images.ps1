# Download hotel stock photos from Unsplash (free license) into images/hotels/
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "images\hotels"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

$sets = @{
    exterior = @(
        "photo-1542314831-068cd1dbfeeb", "photo-1551882547-ff40e63c5eae",
        "photo-1566073770569-3f02a6ddcb9d", "photo-1571896349842-33c89424de2d",
        "photo-1445019980597-93fa8acb246c", "photo-1520250497591-112f2f40a3f4",
        "photo-1582719508461-905c673771fd", "photo-1611892440504-42a7929dcede",
        "photo-1571003123894-1f0594d2b5d9", "photo-1523217582562-09d0def993a6",
        "photo-1564501049412-61c2a3083791", "photo-1584132915077-3ed824c58f0f"
    )
    lobby = @(
        "photo-1618777443508-ca9ef4cbda7d", "photo-1495363371868-ca61fc71e961",
        "photo-1544161515-4ab6ce6db949", "photo-1566073770569-3f02a6ddcb9d",
        "photo-1551882547-ff40e63c5eae", "photo-1611892440504-42a7929dcede",
        "photo-1578683010236-d716f9a3f461", "photo-1595576501578-2d4e0b9e4c2a",
        "photo-1631049307264-e0fb4c5e3b35", "photo-1590490360182-c33d57733427",
        "photo-1582719478250-c89cae4dc85b", "photo-1520250497591-112f2f40a3f4c"
    )
    standard_room = @(
        "photo-1631049307264-e0fb4c5e3b35", "photo-1590490360182-c33d57733427",
        "photo-1582719478250-c89cae4dc85b", "photo-1566665797739-1674de7a421a",
        "photo-1591088398332-f223540bb6dc", "photo-1611892440504-42a7929dcede",
        "photo-1522771739844-6a9f6d5f14af", "photo-1560185127-6ed189bf02f4",
        "photo-1596394516093-501ba68a0b6a", "photo-1586023492125-27b2c045efd7",
        "photo-1598928506311-c55ded39a2c6", "photo-1578683010236-d716f9a3f461"
    )
    deluxe_room = @(
        "photo-1578683010236-d716f9a3f461", "photo-1595576501578-2d4e0b9e4c2a",
        "photo-1566665797739-1674de7a421a", "photo-1584132915077-3ed824c58f0f",
        "photo-1618221195710-dd6b41faaea6", "photo-1505693416388-ac5ce068fe85",
        "photo-1590490360182-c33d57733427", "photo-1631049307264-e0fb4c5e3b35",
        "photo-1522771739844-6a9f6d5f14af", "photo-1560185127-6ed189bf02f4",
        "photo-1591088398332-f223540bb6dc", "photo-1586023492125-27b2c045efd7"
    )
    bathroom = @(
        "photo-1584622650111-993a426fbf0a", "photo-1620626011761-996317b8d101",
        "photo-1600566753190-17f0baa2a6a3", "photo-1552321554-5fefe8c9ef14",
        "photo-1585412727317-260b57a0a4d6", "photo-1600607687939-ce8a6c25118c",
        "photo-1600585154340-be6161a56a0c", "photo-1600607687644-c7171b42498f",
        "photo-1556912172-45b7abe8b7e1", "photo-1600566752355-35792bedcfea",
        "photo-1600047509807-ba8f99d2cd7a", "photo-1600585154526-990dced4db0d"
    )
    restaurant = @(
        "photo-1414235077428-338989a2e8c0", "photo-1559339352-11d035aa65de",
        "photo-1517248135467-4c7edcad34c4", "photo-1550966841-3edead59de23",
        "photo-1555396273-367ea4eb4db5", "photo-1466978913421-dad2ebd01d17",
        "photo-1552566626-52f8b828add9", "photo-1424847651672-bf20a4b0982b",
        "photo-1504674900247-0877df9cc836", "photo-1551218808-94e220e084d2",
        "photo-1414235077428-338989a2e8c0", "photo-1559339352-11d035aa65de"
    )
}

foreach ($cat in $sets.Keys) {
    $ids = $sets[$cat]
    for ($i = 0; $i -lt 12; $i++) {
        $n = "{0:D2}" -f ($i + 1)
        $file = Join-Path $outDir "$cat-$n.jpg"
        $id = $ids[$i]
        $url = "https://images.unsplash.com/$id`?auto=format&fit=crop&w=800&q=75"
        Write-Host "GET $cat-$n.jpg ..."
        try {
            Invoke-WebRequest -Uri $url -OutFile $file -UserAgent $ua -MaximumRedirection 5
        } catch {
            Write-Warning "Failed $cat-$n : $_"
        }
        Start-Sleep -Milliseconds 300
    }
}

Write-Host "Done. Files in $outDir"
