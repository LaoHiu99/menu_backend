import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { readFile, rename, unlink, readdir } from 'fs/promises';
import { basename, join } from 'path';
import Jimp from 'jimp';
import { UPLOADS_ROOT } from './upload.paths';

/** 平均哈希汉明距离 ≤ 此值时，视为「同一张图」（应对微信多次压缩导致字节不同） */
const PERCEPTUAL_MAX_HAMMING = 14;

const IMAGE_NAME_PATTERN = /\.(jpe?g|png|gif|webp)$/i;

/** 用 MIME 统一后缀，避免同一 JPEG 因 .jpg/.jpeg 不同产生两份文件 */
export function extFromMime(mimetype: string): string {
  const base = (mimetype || '').split(';')[0].trim().toLowerCase();
  switch (base) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}

/** 64 位平均哈希，16 位十六进制字符串 */
async function averageHashHex(buffer: Buffer): Promise<string> {
  const img = await Jimp.read(buffer);
  img.resize(8, 8);
  img.greyscale();
  const pixels: number[] = [];
  let sum = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const { r } = Jimp.intToRGBA(img.getPixelColor(x, y));
      pixels.push(r);
      sum += r;
    }
  }
  const avg = sum / 64;
  let bits = '';
  for (const v of pixels) {
    bits += v >= avg ? '1' : '0';
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex.padStart(16, '0');
}

function hammingHex64(a: string, b: string): number {
  if (a.length !== b.length || a.length !== 16) {
    return 999;
  }
  let dist = 0;
  for (let i = 0; i < 16; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

/**
 * 在 uploads 目录里查找与本次上传视觉上相同的已有文件（含已不再被任何用户引用的旧头像），避免同一张图多次落盘。
 */
async function findPerceptualDuplicateInUploads(
  newBuf: Buffer,
  tempDiskPath: string,
): Promise<string | null> {
  let hNew: string;
  try {
    hNew = await averageHashHex(newBuf);
  } catch {
    return null;
  }

  const tempBase = basename(tempDiskPath);
  let names: string[];
  try {
    names = await readdir(UPLOADS_ROOT);
  } catch {
    return null;
  }

  for (const name of names) {
    if (!IMAGE_NAME_PATTERN.test(name)) {
      continue;
    }
    if (name === tempBase) {
      continue;
    }
    const fp = join(UPLOADS_ROOT, name);
    try {
      const oldBuf = await readFile(fp);
      const hOld = await averageHashHex(oldBuf);
      if (hammingHex64(hNew, hOld) <= PERCEPTUAL_MAX_HAMMING) {
        return name;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 1) 字节完全一致 → 复用已有 SHA256 文件名。
 * 2)（可选）与 uploads 内任一已有图片感知一致 → 删除临时文件并复用该文件名（头像场景）。
 * 3) 否则按 SHA256 新文件名落盘。
 */
export async function replaceWithContentAddressedFile(
  tempDiskPath: string,
  mimetype: string,
  /** 头像等场景：允许「视觉上相同」即复用已有文件；菜品图应传 false，避免误判成别的图 */
  perceptualDedupe = true,
): Promise<string> {
  const buf = await readFile(tempDiskPath);
  const exactHash = createHash('sha256').update(buf).digest('hex');
  const ext = extFromMime(mimetype);
  const exactName = `${exactHash}${ext}`;
  const exactPath = join(UPLOADS_ROOT, exactName);

  if (existsSync(exactPath)) {
    await unlink(tempDiskPath);
    return exactName;
  }

  if (perceptualDedupe) {
    const perceptualDup = await findPerceptualDuplicateInUploads(buf, tempDiskPath);
    if (perceptualDup) {
      await unlink(tempDiskPath);
      return perceptualDup;
    }
  }

  try {
    await rename(tempDiskPath, exactPath);
  } catch {
    if (existsSync(exactPath)) {
      await unlink(tempDiskPath);
      return exactName;
    }
    throw new Error('保存头像文件失败');
  }

  return exactName;
}
