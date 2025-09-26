import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { CategoryService } from '../category/category.service';
import { ConfigService } from '@nestjs/config';

describe('ProductService', () => {
    let service: ProductService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService, ConfigService,
                {
                    provide: getRepositoryToken(Product),
                    useValue: {}
                },
                {
                    provide: FarmService,
                    useValue: {}
                },
                {
                    provide: CategoryService,
                    useValue: {}
                },
            ],
        }).compile();

        service = module.get<ProductService>(ProductService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
