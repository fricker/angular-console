
import { Params } from '@angular/router';
import { PlatformType } from '../platform/platform-type';

export interface ResourceTarget {
    projectName: string;
    resourcePath: string;
    projectType?: string;
    platformType?: PlatformType;
    params?: Params;
    title?: string;
}
