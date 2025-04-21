import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Get,
  UseGuards,
  Query,
  Delete,
  Res,
} from '@nestjs/common';
import { FilesService } from './files.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileStorage } from './storage';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UserId } from 'src/decarator/user-id.decorator';
import { FileType } from './entities/file.entity';
import { Response } from 'express';
import * as AdmZip from 'adm-zip';

@Controller('files')
@ApiTags('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll(@UserId() userId: number, @Query('type') fileType: FileType) {
    return this.filesService.findAll(userId, fileType);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: Express.Multer.File,
    @UserId() userId: number,
  ) {
    return this.filesService.create(file, userId);
  }

  @Get('download')
  @ApiQuery({ name: 'ids', description: 'Comma-separated file IDs' })
  async download(@Query('ids') ids: string, @Res() res: Response) {
    const files = await this.filesService.findByIds(ids);

    if (files.length === 1) {
      const filePath = `./upload/${files[0].filename}`;
      const fileName = files[0].originalName;

      res.setHeader('Content-Type', files[0].mimetype);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      return res.sendFile(filePath, { root: process.cwd() });
    }

    const zip = new AdmZip();
    files.forEach((file) => {
      zip.addLocalFile(`./upload/${file.filename}`, '', file.originalName);
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(zip.toBuffer());
  }

  @Delete()
  remove(@UserId() userId: number, @Query('ids') ids: string) {
    return this.filesService.remove(userId, ids);
  }
}
