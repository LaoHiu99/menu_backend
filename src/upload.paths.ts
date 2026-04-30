import { join } from 'path';

/**
 * 上传目录固定在「后端项目根/menu_backend/uploads」，与启动时的 cwd 无关。
 * 编译后本文件位于 dist/，故上一级即为项目根。
 */
export const UPLOADS_ROOT = join(__dirname, '..', 'uploads');
