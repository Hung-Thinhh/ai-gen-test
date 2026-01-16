# PowerShell script to fix output_images in all component files
$componentsPath = "d:\test\tesst_img_ai\my-app\src\components"
$files = Get-ChildItem -Path $componentsPath -Filter "*.tsx" -Recurse

$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Replace: output_images: urlsWithMetadata
    $content = $content -replace 'output_images:\s*urlsWithMetadata', 'output_images: resultUrls'
    
    # Replace: output_images: [urlWithMetadata]
    $content = $content -replace 'output_images:\s*\[urlWithMetadata\]', 'output_images: [resultUrl]'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
        $filesModified++
    }
}

Write-Host "`nTotal modified: $filesModified files"
