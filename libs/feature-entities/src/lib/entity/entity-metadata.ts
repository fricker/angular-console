
import { Observable } from 'rxjs';
import { FlatTreeControl } from '@angular/cdk/tree';
import { DirectoryDataSource, DynamicFlatNode } from '@angular-console/ui';
import { Project, Directory } from '@angular-console/schema';
import { Finder } from '@angular-console/utils';

export class EntityMetadata {

    selectedNode: DynamicFlatNode | null;
    readonly disableNode: (node: DynamicFlatNode) => boolean = () => false;
    readonly treeControl: FlatTreeControl<DynamicFlatNode> = new FlatTreeControl(
        node => node.level,
        node => this.hasChild(0, node)
    );
    readonly dataSource = new DirectoryDataSource(this.treeControl, this.finder);

    constructor(public project: Project, private finder: Finder) {}

    listFiles(path: string): Observable<Directory> {
        return this.finder.listFiles(path);
    }

    private hasChild(index: number, node: DynamicFlatNode): boolean {
        return node.file.type === 'directory';
    }
}
