import { Controller } from '@nestjs/common';
import { UserPreferenceService } from './user-preference.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';

@Controller('user-preference')
export class UserPreferenceController {

    constructor(private userPreferenceService: UserPreferenceService) { }

    async getMyPreference(@User() user: UserInterface) {
        return await this.userPreferenceService.getUserPreference(user.id);
    }
}
