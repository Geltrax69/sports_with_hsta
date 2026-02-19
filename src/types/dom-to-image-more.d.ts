declare module 'dom-to-image-more' {
  const domtoimage: {
    toPng(node: HTMLElement, options?: Record<string, any>): Promise<string>
    toJpeg?(node: HTMLElement, options?: Record<string, any>): Promise<string>
    toSvg?(node: HTMLElement, options?: Record<string, any>): Promise<string>
    toPixelData?(node: HTMLElement, options?: Record<string, any>): Promise<Uint8Array>
    toBlob?(node: HTMLElement, options?: Record<string, any>): Promise<Blob>
  }
  export default domtoimage
}
