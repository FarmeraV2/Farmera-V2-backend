import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UnauthorizedException, UploadedFiles } from '@nestjs/common';
import { FarmService } from './farm.service';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { Farm } from '../entities/farm.entity';
import { FarmRegistrationDto } from '../dtos/farm-registration.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { UpdateFarmDto } from '../dtos/update-farm.dto';
import { UpdateFarmAvatarDto, UpdateFarmImagesDto } from '../dtos/update-farm-images.dto';

@Controller('farm')
export class FarmController {

    constructor(private readonly farmService: FarmService) { }

    @Post('register')
    async farmRegister(@User() user: UserInterface, @Body() farmRegistration: FarmRegistrationDto): Promise<Farm> {
        return await this.farmService.farmRegister(farmRegistration, user.id);
    }

    @Post('verify/:farmId')
    async farmVerify(
        @UploadedFiles() file: {
            cccd?: Express.Multer.File[];
            biometric_video?: Express.Multer.File[];
        },
        @Param('farmId') farmId: number,
        @User() user: UserInterface,
    ) {
        if (!file || !file.cccd?.[0] || !file.biometric_video?.[0]) {
            throw new BadRequestException('Thiếu ảnh CCCD hoặc video sinh trắc học');
        }
        return await this.farmService.verifyBiometric(
            file.cccd?.[0],
            file.biometric_video?.[0],
            farmId,
            user.id,
        );
    }

    @Get('my')
    async getMyFarm(@User() user: UserInterface) {
        return await this.farmService.getUserFarm(user.id);
    }

    @Public()
    @Get('owner/:userId')
    async getFarmByOwnerId(@Param('userId') userId: string) {
        return await this.farmService.getFarmByOwner(userId);
    }

    @Public()
    @Get(':farmId')
    async getFarm(@Param('farmId') farmId: string) {
        return await this.farmService.findFarmById(farmId);
    }

    @Patch()
    async updateFarm(@Body() updateFarmDto: UpdateFarmDto, @User() user: UserInterface) {
        if (!user.farm_id || !user.farm_uuid) throw new UnauthorizedException('Unauthorized user');
        return await this.farmService.updateFarm(user.farm_id, updateFarmDto);
    }

    @Patch("avatar")
    async updateFarmAvatar(@Body() updateFarmDto: UpdateFarmAvatarDto, @User() user: UserInterface) {
        if (!user.farm_id || !user.farm_uuid) throw new UnauthorizedException('Unauthorized user');
        return await this.farmService.updateFarmAvatar(user.farm_id, updateFarmDto);
    }

    @Patch("images")
    async updateFarmImages(@Body() updateFarmDto: UpdateFarmImagesDto, @User() user: UserInterface) {
        if (!user.farm_id || !user.farm_uuid) throw new UnauthorizedException('Unauthorized user');
        return await this.farmService.updateFarmImages(user.farm_id, updateFarmDto);
    }

    /*#########################################################################
                                     todo!                                   
    #########################################################################*/

    // @Public()
    // @Get('search')
    // async searchFarms(@Query() searchDto: SearchFarmDto) {
    //     return await this.farmService.searchFarm(searchDto);
    // }

    // @Public()
    // @Get("stats/:farmId")
    // async getFarmStats(@Param("farmId") farmId: string) {
    //     return await this.farmService.getFarmStats(farmId);
    // }

    /*#########################################################################
                                   Deprecated                                
    #########################################################################*/
    // @Public()
    // @Get('all')
    // async listFarms(@Query() paginationOptions: PaginationOptions) {
    //     return await this.farmsService.listFarms(paginationOptions);
    // }
}
