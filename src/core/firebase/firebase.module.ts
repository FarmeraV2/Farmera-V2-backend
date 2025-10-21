import { Module } from '@nestjs/common';
import { FcmService } from './fcm/fcm.service';
import * as admin from "firebase-admin";
import { applicationDefault } from 'firebase-admin/app';
import { FcmController } from './fcm/fcm.controller';

@Module({
  providers: [FcmService],
  controllers: [FcmController],
  exports: [FcmService]
})
export class FirebaseModule {
  constructor() {
    admin.initializeApp({
      credential: applicationDefault()
    })
  }
}
