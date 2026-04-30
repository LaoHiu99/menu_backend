export class UpdateProfileDto {
  nickname?: string;
  signature?: string;
  /** 头像持久化地址（可为上传接口返回的完整 URL 或 /uploads/ 相对路径） */
  avatarUrl?: string;
}