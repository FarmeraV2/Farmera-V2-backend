import { Test, TestingModule } from '@nestjs/testing';
import { OldAddressService } from './old-address.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OldProvince } from '../entities/old-province.entity';
import { OldDistrict } from '../entities/old-district.entity';
import { OldWard } from '../entities/old-ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('OldAddressService', () => {
  let service: OldAddressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OldAddressService, ConfigService,
        {
          provide: getRepositoryToken(OldProvince),
          useValue: {}
        },
        {
          provide: getRepositoryToken(OldDistrict),
          useValue: {}
        },
        {
          provide: getRepositoryToken(OldWard),
          useValue: {}
        },
        {
          provide: getRepositoryToken(HttpService),
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<OldAddressService>(OldAddressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
