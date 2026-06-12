const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const inputDir = './public/images'
const outputDir = './public/images/optimized'

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Optimize images
async function optimizeImages() {
  const files = fs.readdirSync(inputDir)
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file)
    const ext = path.extname(file).toLowerCase()
    
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue
    
    const baseName = path.basename(file, ext)
    
    // Create WebP version
    await sharp(inputPath)
      .webp({ quality: 75 })
      .resize(1200, null, { withoutEnlargement: true })
      .toFile(path.join(outputDir, `${baseName}.webp`))
    
    // Create AVIF version (smaller, faster)
    await sharp(inputPath)
      .avif({ quality: 65 })
      .resize(1200, null, { withoutEnlargement: true })
      .toFile(path.join(outputDir, `${baseName}.avif`))
    
    console.log(`Optimized: ${file}`)
  }
  
  console.log('Image optimization complete!')
}

optimizeImages().catch(console.error)
