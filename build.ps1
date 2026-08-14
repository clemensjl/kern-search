# Kompletter Refresh: Quellen laden -> parsen -> Thumbnails -> Linkfrische -> optional deployen.
# Aufruf:  .\build.ps1                  (bauen + rollierende Linkpruefung)
#          .\build.ps1 -SkipLinkCheck   (nur bauen, vorhandene Pruefdaten uebernehmen)
#          .\build.ps1 -LinkLimit 3000  (groesseres Pruefkontingent in diesem Lauf)
#          .\build.ps1 -Deploy          (bauen + committen + pushen = live)
#
# Rollierende Pruefung statt Vollpruefung: 35k Weidian-Links bei jedem Build
# anzufassen ist weder noetig noch gegenueber Weidian vertretbar. -MaxAge legt
# fest, wie lange eine Pruefung gilt; pro Lauf werden hoechstens -LinkLimit IDs
# angefasst, nie gepruefte zuerst, danach die aeltesten. Bei 30 Tagen Gueltigkeit
# und ~35k Items sind das im Schnitt ~1.200 Pruefungen pro Tag - mit dem
# Standardkontingent also ein Lauf pro Tag. Den kompletten Durchlauf in einem
# Rutsch macht iterate_linkcheck.ps1 ueber die GitHub-Actions-Shards.
param(
    [switch]$Deploy,
    [switch]$SkipLinkCheck,
    [int]$LinkLimit = 1200,
    [int]$MaxAge = 30
)
$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"
Set-Location $PSScriptRoot

python scripts\fetch.py
python scripts\parse.py
python scripts\enrich.py
python scripts\thumbs.py

if (-not $SkipLinkCheck) {
    Write-Host "Rollierende Linkpruefung: max $LinkLimit IDs, Gueltigkeit $MaxAge Tage"
    python scripts\check_links.py --max-age $MaxAge --limit $LinkLimit
} else {
    Write-Host "Linkpruefung uebersprungen - meta.lc behaelt die bisherigen Pruefdaten."
}

python scripts\compact.py
python scripts\prune_dead.py

if ($Deploy) {
    git add -A
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        git commit -m "refresh $(Get-Date -Format yyyy-MM-dd)"
        git push
        Write-Host "Gepusht - GitHub Actions deployt in ~1 Minute."
    } else {
        Write-Host "Keine Aenderungen - nichts zu deployen."
    }
}
