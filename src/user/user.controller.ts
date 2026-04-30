import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Headers,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UPLOADS_ROOT } from '../upload.paths';
import { replaceWithContentAddressedFile } from '../upload-dedupe';

const uploadsDir = UPLOADS_ROOT;

type MulterDiskStoredFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
};

function resolveBearerForUpload(
  authorization: string | undefined,
  tokenQuery: string | undefined,
): string | undefined {
  const q = tokenQuery?.trim();
  if (authorization?.startsWith('Bearer ')) {
    return authorization;
  }
  if (q) {
    return q.startsWith('Bearer ') ? q : `Bearer ${q}`;
  }
  return undefined;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.userService.login(loginDto);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '') || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif|webp)/i,
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    file: MulterDiskStoredFile,
    @Headers('authorization') authorization?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const bearer = resolveBearerForUpload(authorization, tokenQuery);
    const internalUserId =
      this.userService.getInternalUserIdFromBearer(bearer);
    const finalName = await replaceWithContentAddressedFile(
      file.path,
      file.mimetype,
    );
    const relative = `/uploads/${finalName}`;
    await this.userService.updateAvatarByInternalId(internalUserId, relative);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return { avatarUrl: `${baseUrl}${relative}` };
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return await this.userService.getProfile(userId);
  }

  @Put('profile/:userId')
  async updateProfile(
    @Param('userId') userId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const internalUserId =
      this.userService.getInternalUserIdFromBearer(authorization);
    return await this.userService.updateProfile(
      userId,
      updateProfileDto,
      internalUserId,
    );
  }
}
