# PowerShell script to download sound effects
$ErrorActionPreference = "Stop"

# Create directory if it doesn't exist
$directory = $PSScriptRoot
if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force
}

# Define sound URLs and filenames
$sounds = @(
    @{
        Url = "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3"
        Filename = "countdown-beep.mp3"
        Description = "Countdown beep sound"
    },
    @{
        Url = "https://assets.mixkit.co/active_storage/sfx/1990/1990-preview.mp3"
        Filename = "battle-start.mp3"
        Description = "Battle start sound"
    }
)

# Download each sound
foreach ($sound in $sounds) {
    $outputPath = Join-Path -Path $directory -ChildPath $sound.Filename
    Write-Host "Downloading $($sound.Description)..."
    
    try {
        Invoke-WebRequest -Uri $sound.Url -OutFile $outputPath
        Write-Host "Downloaded to $outputPath"
    } catch {
        Write-Host "Failed to download $($sound.Filename): $_"
    }
}

Write-Host "Download complete!" 