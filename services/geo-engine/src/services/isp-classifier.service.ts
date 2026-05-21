import { Injectable } from '@nestjs/common';
import { ConnectionType } from '../constants/geo.constants';
import { CLASSIFIER_PRIORITY } from '../constants/classifier.constants';

@Injectable()
export class IspClassifierService {
  classify(ispName: string): ConnectionType {
    if (!ispName) return ConnectionType.UNKNOWN;

    const lower = ispName.toLowerCase();

    for (const rule of CLASSIFIER_PRIORITY) {
      for (const keyword of rule.keywords) {
        if (lower.includes(keyword)) {
          return rule.type;
        }
      }
    }

    return ConnectionType.UNKNOWN;
  }
}
