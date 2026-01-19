import { BadRequestException, Body, Controller, Get, MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FarmService } from './farm.service';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { FarmRegistrationDto } from '../dtos/farm/farm-registration.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { UpdateFarmDto } from '../dtos/farm/update-farm.dto';
import { UpdateFarmAvatarDto, UpdateFarmImagesDto } from '../dtos/farm/update-farm-images.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SearchProductsDto } from 'src/modules/product/dtos/product/search-product.dto';

@Controller('farm')
export class FarmController {
    constructor(private readonly farmService: FarmService) { }

    @Post('register')
    async farmRegister(@User() user: UserInterface, @Body() farmRegistration: FarmRegistrationDto) {
        return await this.farmService.farmRegister(farmRegistration, user.id);
    }

    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'ssn_img', maxCount: 1 },
            { name: 'biometric_video', maxCount: 1 },
        ]),
    )
    @Post('verify')
    async farmVerify(
        @UploadedFiles(new ParseFilePipe({
            validators: [
                // new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                // todo!("handle this error")
                // new FileTypeValidator({
                //     fileType:
                //         /^(image\/(jpeg|jpg|png|gif|webp|jfif)|video\/(mp4|webm)|application\/pdf)$/,
                // }),
            ],
        }),
        )
        file: {
            ssn_img?: Express.Multer.File[];
            biometric_video?: Express.Multer.File[];
        },
        @Body('farm_id', ParseIntPipe) farmId: number,
        @User() user: UserInterface,
    ) {
        if (!file || !file.ssn_img?.[0] || !file.biometric_video?.[0]) {
            throw new BadRequestException({
                message: 'Thiếu ảnh CCCD hoặc video sinh trắc học',
                code: ResponseCode.INVALID_MEDIA_FILE_INPUT
            });
        }
        return await this.farmService.verifyBiometric(file.ssn_img?.[0], file.biometric_video?.[0], farmId, user.id);
    }

    @Get('my')
    async getMyFarm(@User() user: UserInterface) {
        return await this.farmService.getUserFarm(user.id);
    }

    @Public()
    @Get('owner/:userId')
    async getFarmByOwnerId(@Param('userId') userId: number) {
        return await this.farmService.getFarmByOwner(userId);
    }

    @Public()
    @Get(':farmId')
    async getFarm(@Param('farmId') farmId: number) {
        return await this.farmService.findFarmById(farmId);
    }

    @Patch()
    @Roles([UserRole.FARMER])
    async updateFarm(@Body() updateFarmDto: UpdateFarmDto, @User() user: UserInterface) {
        return await this.farmService.updateFarm(user.farm_id!, updateFarmDto);
    }

    @Patch('avatar')
    @Roles([UserRole.FARMER])
    async updateFarmAvatar(@Body() updateFarmDto: UpdateFarmAvatarDto, @User() user: UserInterface) {
        return await this.farmService.updateFarmAvatar(user.farm_id!, updateFarmDto);
    }

    @Patch('images')
    @Roles([UserRole.FARMER])
    async updateFarmImages(@Body() updateFarmDto: UpdateFarmImagesDto, @User() user: UserInterface) {
        return await this.farmService.updateFarmImages(user.farm_id!, updateFarmDto);
    }

    @Get('my/product')
    @Roles([UserRole.FARMER])
    async getFarmProducts(@User() user: UserInterface, @Query() getProductByFarmDto: SearchProductsDto) {
        return await this.farmService.getMyFarmProducts(user.farm_id!, getProductByFarmDto);
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
