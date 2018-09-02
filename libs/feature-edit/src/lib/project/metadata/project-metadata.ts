
import { Observable } from 'rxjs';
import { Project, Directory } from '@angular-console/schema';
import { Finder } from '@angular-console/utils';

export class ProjectMetadata {

    constructor(public project: Project, private finder: Finder) {}

    listFiles(path: string): Observable<Directory> {
        return this.finder.listFiles(path);
    }
}
