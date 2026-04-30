export class LoginDto {
  /** wx.login 换取的 code，服务端用 code 换 openid */
  code: string;
}
