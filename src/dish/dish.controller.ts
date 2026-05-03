import {
  Controller, Post, Put, Delete, Body, Param, Get, Query,
  UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { UPLOADS_ROOT } from '../upload.paths';
import { replaceWithContentAddressedFile } from '../upload-dedupe';

@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    return await this.dishService.findAll(categoryId ? +categoryId : undefined);
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

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_ROOT,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '') || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
    }),
  )
  async uploadImage(
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
    file: { path: string; mimetype: string },
  ) {
    const finalName = await replaceWithContentAddressedFile(file.path, file.mimetype);
    return { imageUrl: `/uploads/${finalName}` };
  }

  @Get('search')
  async search(@Query('keyword') keyword: string) {
    return await this.dishService.search(keyword);
  }
}
