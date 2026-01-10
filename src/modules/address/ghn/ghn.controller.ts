import { Controller } from "@nestjs/common";
import { GHNService } from "./ghn.service";

@Controller('ghn')
export class GHNController {
    
    constructor(
        private readonly ghnService: GHNService,
    ) {}
}