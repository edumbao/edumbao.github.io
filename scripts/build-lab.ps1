param(
    [Parameter(Mandatory = $true)]
    [string]$Project
)

$root = Split-Path -Parent $PSScriptRoot

$templatePath = Join-Path $root "lab\_template\index.html"
$headerPath = Join-Path $root "includes\lab-header.html"
$footerPath = Join-Path $root "includes\lab-footer.html"

$projectDirectory = Join-Path $root "lab\$Project"
$contentPath = Join-Path $projectDirectory "content.html"
$configPath = Join-Path $projectDirectory "project.json"
$outputPath = Join-Path $projectDirectory "index.html"


if (-not (Test-Path $templatePath)) {
    throw "Template not found: $templatePath"
}

if (-not (Test-Path $headerPath)) {
    throw "Header not found: $headerPath"
}

if (-not (Test-Path $footerPath)) {
    throw "Footer not found: $footerPath"
}

if (-not (Test-Path $projectDirectory)) {
    throw "Project folder not found: $projectDirectory"
}

if (-not (Test-Path $contentPath)) {
    throw "Content file not found: $contentPath"
}

if (-not (Test-Path $configPath)) {
    throw "Project metadata file not found: $configPath"
}


$template = Get-Content $templatePath -Raw -Encoding UTF8
$header = Get-Content $headerPath -Raw -Encoding UTF8
$footer = Get-Content $footerPath -Raw -Encoding UTF8
$content = Get-Content $contentPath -Raw -Encoding UTF8

$config =
    Get-Content $configPath -Raw -Encoding UTF8 |
    ConvertFrom-Json


$footer =
    $footer.Replace(
        "{{PROJECT_TITLE}}",
        $config.title
    )


$output =
    $template.Replace(
        "{{HEADER}}",
        $header
    )

$output =
    $output.Replace(
        "{{FOOTER}}",
        $footer
    )

$output =
    $output.Replace(
        "{{CONTENT}}",
        $content
    )

$output =
    $output.Replace(
        "{{PROJECT_TITLE}}",
        $config.title
    )

$output =
    $output.Replace(
        "{{PROJECT_SLUG}}",
        $config.slug
    )

$output =
    $output.Replace(
        "{{META_DESCRIPTION}}",
        $config.description
    )

$output =
    $output.Replace(
        "{{OG_DESCRIPTION}}",
        $config.ogDescription
    )

$output =
    $output.Replace(
        "{{TWITTER_DESCRIPTION}}",
        $config.twitterDescription
    )


Set-Content `
    -Path $outputPath `
    -Value $output `
    -Encoding UTF8


Write-Host ""
Write-Host "Lab page built successfully:"
Write-Host $outputPath
Write-Host ""