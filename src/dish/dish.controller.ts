import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
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

/** 菜品图最大 5MB（头像为 2MB） */
const DISH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post('upload-image')
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
  async uploadImage(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: DISH_IMAGE_MAX_BYTES }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif|webp)/i,
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    file: MulterDiskStoredFile,
  ) {
    const finalName = await replaceWithContentAddressedFile(
      file.path,
      file.mimetype,
    );
    const relative = `/uploads/${finalName}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      imageUrl: relative,
      /** 便于浏览器直连预览；入库保存 relative 即可，与小程序一致 */
      absoluteUrl: `${baseUrl}${relative}`,
    };
  }

  @Post()
  async create(@Body() createDishDto: CreateDishDto) {
    return await this.dishService.create(createDishDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDishDto: UpdateDishDto) {
    return await this.dishService.update(+id, updateDishDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.dishService.remove(+id);
  }

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    const parsed =
      categoryId != null && categoryId !== ''
        ? parseInt(categoryId, 10)
        : undefined;
    return await this.dishService.findAll(
      parsed !== undefined && !Number.isNaN(parsed) ? parsed : undefined,
    );
  }

  @Get('search')
  async search(@Query('keyword') keyword: string) {
    return await this.dishService.search(keyword);
  }
}
