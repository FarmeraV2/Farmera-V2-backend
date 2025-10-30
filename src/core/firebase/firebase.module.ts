import { Module } from '@nestjs/common';
import { FcmService } from './fcm/fcm.service';
import * as admin from "firebase-admin";
import { applicationDefault, getApp, getApps } from 'firebase-admin/app';

@Module({
  providers: [FcmService],
  exports: [FcmService]
})
export class FirebaseModule {
  constructor() {
    if (!getApps().length) {
      admin.initializeApp({
        credential: applicationDefault()
      })
    }
    else {
      getApp()
    }
  }
}
