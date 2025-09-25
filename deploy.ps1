# YPrompt Deployment Script for Baota Panel

param(
    [string]$ZipName = "yprompt-dist.zip"
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "    YPrompt Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Check Node.js
    Write-Host "Checking environment..." -ForegroundColor Yellow
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js not found. Please install Node.js first."
    }
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

    # Check project files
    if (-not (Test-Path "package.json")) {
        throw "package.json not found. Please run this script in the project root directory."
    }
    Write-Host "Project files check passed" -ForegroundColor Green
    Write-Host ""

    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Dependency installation failed"
    }
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""

    # Build project
    Write-Host "Building production version..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "Build completed successfully" -ForegroundColor Green
    Write-Host ""

    # Check dist directory
    if (-not (Test-Path "dist")) {
        throw "Build failed: dist directory not found"
    }

    # Remove old zip
    if (Test-Path $ZipName) {
        Write-Host "Removing old zip file..." -ForegroundColor Yellow
        Remove-Item $ZipName -Force
        Write-Host "Old zip file removed" -ForegroundColor Green
    }

    # Create zip
    Write-Host "Creating zip file..." -ForegroundColor Yellow
    Compress-Archive -Path "dist\*" -DestinationPath $ZipName -Force
    if (-not (Test-Path $ZipName)) {
        throw "Zip file creation failed"
    }
    
    $zipSize = (Get-Item $ZipName).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    Write-Host "Zip file created successfully: $ZipName ($zipSizeMB MB)" -ForegroundColor Green
    Write-Host ""

    # Display deployment info
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Build completed! Ready for deployment" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Zip file location: $(Get-Location)\$ZipName" -ForegroundColor White
    Write-Host "File size: $zipSizeMB MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps for Baota Panel:" -ForegroundColor Yellow
    Write-Host "1. Login to Baota Panel" -ForegroundColor White
    Write-Host "2. Go to File Manager -> /www/wwwroot/" -ForegroundColor White
    Write-Host "3. Create website directory (e.g., yprompt.yourdomain.com)" -ForegroundColor White
    Write-Host "4. Upload $ZipName to that directory" -ForegroundColor White
    Write-Host "5. Extract the files" -ForegroundColor White
    Write-Host "6. Add website in Baota Panel (Static site)" -ForegroundColor White
    Write-Host "7. Configure Nginx rewrite rules (see deploy-baota.md)" -ForegroundColor White
    Write-Host "8. Configure domain DNS" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed guide, see: deploy-baota.md" -ForegroundColor Cyan
    Write-Host ""

    # Ask to open folder
    Write-Host "Open folder to view zip file? (y/N): " -ForegroundColor Yellow -NoNewline
    $choice = Read-Host
    if ($choice -eq "y" -or $choice -eq "Y") {
        Start-Process explorer.exe -ArgumentList (Get-Location)
    }

} catch {
    Write-Host ""
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure Node.js and npm are installed" -ForegroundColor White
    Write-Host "2. Check network connection (npm install needs internet)" -ForegroundColor White
    Write-Host "3. Run this script in project root directory" -ForegroundColor White
    Write-Host "4. Try deleting node_modules and reinstall dependencies" -ForegroundColor White
    exit 1
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
