import { toPng, toBlob } from 'html-to-image';
import JSZip from 'jszip';

export interface PayslipBlobEntry {
  fileName: string;
  blob: Blob;
}

/**
 * Làm sạch tên file hợp lệ nhưng giữ nguyên dấu tiếng Việt để dễ nhận diện theo tên nhân viên.
 * Nếu trùng tên giữa nhiều nhân viên, tự động thêm mã NV vào cuối (VD: "Nguyễn Văn An (NV002).png").
 */
export function buildSafeEmployeePayslipFileName(
  fullName: string,
  code: string,
  seenNames: Set<string>,
  extension: string = '.png'
): string {
  const sanitized = (fullName || code || 'Nhan_vien')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let baseName = sanitized || code || 'Nhan_vien';
  const key = baseName.toLowerCase();

  if (seenNames.has(key)) {
    const safeCode = (code || '').replace(/[\\/:*?"<>|]/g, '').trim();
    baseName = safeCode ? `${baseName} (${safeCode})` : `${baseName} (${seenNames.size + 1})`;
  }

  seenNames.add(baseName.toLowerCase());
  return `${baseName}${extension}`;
}

export async function renderElementToPngBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    await new Promise((res) => requestAnimationFrame(res));
    const blob = await toBlob(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipAutoScale: false
    });
    return blob;
  } catch (err) {
    console.error('Lỗi khi tạo ảnh Blob phiếu lương:', err);
    return null;
  }
}

export async function downloadElementAsPng(
  element: HTMLElement,
  fileName: string = 'Phieu_Luong.png'
): Promise<boolean> {
  try {
    await new Promise((res) => requestAnimationFrame(res));

    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipAutoScale: false
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Lỗi khi tạo ảnh phiếu lương:', err);
    return false;
  }
}

/**
 * Đóng gói toàn bộ ảnh phiếu lương vào 1 thư mục duy nhất bên trong file .zip
 * Tên mỗi ảnh là tên của từng nhân viên.
 */
export async function createPayslipsZipBlob(
  entries: PayslipBlobEntry[],
  folderName: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(folderName) || zip;

  for (const entry of entries) {
    folder.file(entry.fileName, entry.blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function exportPayslipsToZipFolder(
  entries: PayslipBlobEntry[],
  folderName: string
): Promise<boolean> {
  try {
    const zipBlob = await createPayslipsZipBlob(entries, folderName);
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (err) {
    console.error('Lỗi khi đóng gói thư mục ZIP phiếu lương:', err);
    return false;
  }
}

/**
 * Kiểm tra trình duyệt có hỗ trợ chọn thư mục trực tiếp (File System Access API) và không bị chặn bởi iframe.
 */
export function supportsDirectFolderSave(): boolean {
  if (typeof window === 'undefined') return false;
  const hasPicker = typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
  if (!hasPicker) return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

/**
 * Lưu trực tiếp các ảnh phiếu lương vào 1 thư mục con trên máy người dùng (Chrome/Edge desktop).
 */
export async function exportPayslipsToLocalFolder(
  entries: PayslipBlobEntry[],
  folderName: string
): Promise<'saved' | 'cancelled' | 'unsupported'> {
  if (!supportsDirectFolderSave()) return 'unsupported';

  try {
    const picker = (window as unknown as {
      showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker;
    const rootHandle = await picker({ mode: 'readwrite' });
    const targetDir = await rootHandle.getDirectoryHandle(folderName, { create: true });

    for (const entry of entries) {
      const fileHandle = await targetDir.getFileHandle(entry.fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(entry.blob);
      await writable.close();
    }
    return 'saved';
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'cancelled';
    }
    console.warn('Không thể ghi trực tiếp vào thư mục, chuyển sang tải ZIP:', err);
    return 'unsupported';
  }
}
