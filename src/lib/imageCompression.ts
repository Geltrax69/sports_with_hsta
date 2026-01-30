/**
 * Compress an image file to reduce size for faster loading
 * Target: < 200KB, Quality: 0.75
 * Max dimension: 1200px (optimized for web display)
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height
            height = MAX_HEIGHT
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            
            console.log(`[Image Compression] Original: ${(file.size / 1024).toFixed(2)}KB -> Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB`)
            
            resolve(compressedFile)
          },
          'image/jpeg',
          0.75 // 75% quality - good balance between size and visual quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Validate and compress image file
 * - Checks if file is an image
 * - Checks if file size is under 5MB
 * - Compresses image to optimize size
 */
export async function processImageFile(file: File): Promise<File> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file')
  }
  
  // Validate file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.size > MAX_SIZE) {
    throw new Error('Image size must be less than 5MB')
  }
  
  // If image is already small enough, skip compression
  if (file.size < 500 * 1024) { // 500KB
    console.log(`[Image Compression] Image already optimized: ${(file.size / 1024).toFixed(2)}KB`)
    return file
  }
  
  // Compress the image
  try {
    const compressed = await compressImage(file)
    return compressed
  } catch (error) {
    console.error('[Image Compression] Failed to compress, using original:', error)
    // If compression fails, return original file
    return file
  }
}
