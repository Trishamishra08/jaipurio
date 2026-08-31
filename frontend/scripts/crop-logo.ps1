Add-Type -AssemblyName System.Drawing
$src = Join-Path $PSScriptRoot '..\public\jaipurio_logo.png'
$dest = Join-Path $PSScriptRoot '..\public\jaipurio_logo_header.png'
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $bmp.Width
$h = $bmp.Height

# Find non-white rows to locate wordmark vs reflection
$rows = @()
for ($y = 0; $y -lt $h; $y++) {
  $count = 0
  for ($x = 0; $x -lt $w; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.A -lt 10) { continue }
    if ($c.R -gt 245 -and $c.G -gt 245 -and $c.B -gt 245) { continue }
    $count++
  }
  if ($count -gt 0) { $rows += $y }
}

$top = ($rows | Measure-Object -Minimum).Minimum
$bottom = ($rows | Measure-Object -Maximum).Maximum
$mid = [int](($top + $bottom) / 2)

# Split at midpoint: top half is wordmark, bottom half is reflection
$wordBottom = $mid
$left = 9999; $right = 0
for ($y = $top; $y -le $wordBottom; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.A -lt 10) { continue }
    if ($c.R -gt 245 -and $c.G -gt 245 -and $c.B -gt 245) { continue }
    if ($x -lt $left) { $left = $x }
    if ($x -gt $right) { $right = $x }
  }
}

$pad = 6
$startX = [Math]::Max(0, $left - $pad)
$startY = [Math]::Max(0, $top - $pad)
$cropW = [Math]::Min($w - $startX, ($right - $left + 1 + ($pad * 2)))
$cropH = [Math]::Min($h - $startY, ($wordBottom - $top + 1 + ($pad * 2)))
$rect = New-Object System.Drawing.Rectangle($startX, $startY, $cropW, $cropH)
$cropped = $bmp.Clone($rect, $bmp.PixelFormat)
$cropped.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "wordmark crop: top=$top bottom=$wordBottom left=$left right=$right -> $($cropped.Width)x$($cropped.Height)"
$bmp.Dispose()
$cropped.Dispose()
