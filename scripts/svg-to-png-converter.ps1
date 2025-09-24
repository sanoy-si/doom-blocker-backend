# PowerShell script to convert SVG to PNG using built-in Windows capabilities
param(
    [string]$SvgPath,
    [string]$PngPath,
    [int]$Width,
    [int]$Height
)

try {
    # Read SVG content
    $svgContent = Get-Content $SvgPath -Raw
    
    # Create a temporary HTML file that renders the SVG
    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; }
        svg { width: ${Width}px; height: ${Height}px; }
    </style>
</head>
<body>
$svgContent
</body>
</html>
"@
    
    $tempHtmlPath = [System.IO.Path]::GetTempFileName() + ".html"
    $htmlContent | Out-File -FilePath $tempHtmlPath -Encoding UTF8
    
    Write-Host "Created temporary HTML file: $tempHtmlPath"
    Write-Host "Please manually convert $SvgPath to $PngPath using:"
    Write-Host "1. Open the HTML file in a browser"
    Write-Host "2. Take a screenshot or use browser dev tools to save as PNG"
    Write-Host "3. Or use an online SVG to PNG converter"
    
} catch {
    Write-Error "Error converting SVG: $($_.Exception.Message)"
}
