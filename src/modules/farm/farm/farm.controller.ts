import { Body, Controller, Post } from '@nestjs/common';
import { FarmService } from './farm.service';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { Farm } from '../entities/farm.entity';
import { FarmRegistrationDto } from '../dtos/farm-registration.dto';

@Controller('farm')
export class FarmController {
    constructor(private readonly farmService: FarmService) { }

    // @Post('register')
    // async farmRegister(@User() user: UserInterface, @Body() farmRegistration: FarmRegistrationDto): Promise<Farm> {
    //     return await this.farmService.farmRegister(farmRegistration, user.id);
    // }

    // @Post('verify/:farmId')
    // async farmVerify(@UploadedFiles()
    // file: {
    //     cccd?: Express.Multer.File[];
    //     biometric_video?: Express.Multer.File[];
    // },
    //     @Param('farmId') farmId: string,
    //     @User() user: UserInterface,
    // ) {
    //     if (!file || !file.cccd?.[0] || !file.biometric_video?.[0]) {
    //         throw new BadRequestException('Thiếu ảnh CCCD hoặc video sinh trắc học');
    //     }

    //     return await this.farmsService.farmVerify(
    //         file.cccd?.[0],
    //         file.biometric_video?.[0],
    //         farmId,
    //         user.id,
    //     );
    // }

    // @Get('my/farm')
    // async getMyFarm(@User() user: UserInterface) {
    //     return await this.farmsService.getFarmByUserId(user.id);
    // }

    // @Public()
    // @Get('owner/:userId')
    // async getFarmByUserId(@Param('userId') userId: string) {
    //     return await this.farmsService.getFarmByUserId(userId);
    // }

    // @Public()
    // @Get("stats/:farmId")
    // async getFarmStats(@Param("farmId") farmId: string) {
    //     return await this.farmsService.getFarmStats(farmId);
    // }

    // @Public()
    // @Get('all')
    // async listFarms(@Query() paginationOptions: PaginationOptions) {
    //     return await this.farmsService.listFarms(paginationOptions);
    // }

    // @Public()
    // @Get('search')
    // async searchFarms(@Query() searchDto: SearchFarmDto) {
    //     return await this.farmsService.searchFarms(searchDto);
    // }

    // @Public()
    // @Get(':farmId')
    // async getFarm(@Param('farmId') farmId: string) {
    //     return await this.farmsService.getFarm(farmId);
    // }

    // @Patch(':farmId')
    // async updateFarm(
    //     @Param('farmId') farmId: string,
    //     @Body() updateFarmDto: UpdateFarmDto,
    //     @User() user: UserInterface,
    // ) {
    //     return await this.farmsService.updateFarm(farmId, updateFarmDto, user.id);
    // }
}
