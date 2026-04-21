$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = "$scriptDir;$env:Path"
Write-Host "Prepended shim directory to PATH: $scriptDir"
Write-Host "Now docker resolves to scripts/docker.cmd before system Docker."
