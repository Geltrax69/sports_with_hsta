const MAX_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 1600 // plenty for an ID photo or a certificate scan
const SHRINK_ABOVE = 1.5 * 1024 * 1024

const typeFromName = (name: string) =>
  /\.jpe?g$/i.test(name) ? 'image/jpeg' : /\.png$/i.test(name) ? 'image/png' : /\.pdf$/i.test(name) ? 'application/pdf' : ''

/** Result the file inputs act on: a ready file, or a sentence to show the applicant. */
export type PreparedUpload = { file: File; error?: undefined } | { file?: undefined; error: string }

/**
 * Gets a picked file ready to upload from a phone.
 * - Photos are decoded here, so a damaged or unsupported picture is caught now, not after a long upload.
 * - Large photos (most phone cameras take 5–12 MB) are shrunk to a JPG well under the limit
 *   instead of being refused — which also makes the upload far less likely to drop on mobile data.
 * - Files some Android pickers hand over with no type get one from their name.
 */
export async function prepareUpload(original: File, opts: { allowPdf: boolean; label: string }): Promise<PreparedUpload> {
  const type = original.type || typeFromName(original.name)
  const file = type === original.type ? original : new File([original], original.name, { type })

  if (file.size === 0) return { error: `The ${opts.label} "${file.name}" is empty. Please choose it again.` }

  if (type === 'application/pdf') {
    if (!opts.allowPdf) return { error: `The ${opts.label} must be a photo (JPG or PNG), not a PDF.` }
    if (file.size > MAX_BYTES) {
      return { error: `The PDF "${file.name}" is ${(file.size / 1048576).toFixed(1)} MB. It must be under 5 MB — upload a photo of the document instead.` }
    }
    return { file }
  }

  let bitmap: ImageBitmap
  try {
    // Decodes anything the phone's browser can open (JPG, PNG, WebP, HEIC on iPhone).
    bitmap = await createImageBitmap(file)
  } catch {
    return {
      error: `"${file.name}" could not be opened as a photo. It may be damaged, or an iPhone HEIC picture — please choose a JPG or PNG ${opts.label}.`,
    }
  }

  const isJpgOrPng = type === 'image/jpeg' || type === 'image/png'
  const bigSide = Math.max(bitmap.width, bitmap.height)
  if (isJpgOrPng && file.size <= SHRINK_ABOVE && bigSide <= MAX_SIDE * 1.25) {
    bitmap.close()
    return { file }
  }

  const scale = Math.min(1, MAX_SIDE / bigSide)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff' // transparent PNG areas would otherwise turn black in a JPG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) return { error: `"${file.name}" could not be processed. Please choose a different ${opts.label}.` }
  return { file: new File([blob], file.name.replace(/\.[^.]*$/, '') + '.jpg', { type: 'image/jpeg' }) }
}
