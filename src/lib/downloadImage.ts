import html2canvas from 'html2canvas-pro';

export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string,
  options?: {
    quality?: number;
    backgroundColor?: string;
    scale?: number;
    captureWidth?: number;
  }
): Promise<void> {
  const { quality = 0.92, backgroundColor = '#ffffff', scale = 2, captureWidth } = options || {};

  // Ensure fonts are loaded before capture
  await document.fonts.ready;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
    width: captureWidth || element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: captureWidth || element.scrollWidth,
  });

  const link = document.createElement('a');
  link.download = `${filename}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', quality);
  link.click();
}
