
import { Subject } from 'rxjs';
import { TaskCollection, TaskCollections } from '@angular-console/ui';

import { EntityMetadata } from '../entity/entity-metadata';

export interface EntityTarget {
    projectName: string;
    targetName: string;
    metadata: EntityMetadata;
}

export class EntityProjects<EM extends EntityMetadata> {

    private entityTasks: Array<TaskCollection<EntityTarget>> = [];
    selectedProject: EM | null = null;

    constructor(public workspacePath: string, public projectMetadata: Array<EM>, private target: EntityTarget) {}

    set entityTasksSubject(tasksSubject: Subject<TaskCollections<EntityTarget>>) {
        this.projectMetadata.forEach((metadata) => {
            const srcPath = this.workspacePath + '/' + metadata.project.root + '/src';
            metadata.listFiles(srcPath).subscribe((srcDir) => {
                srcDir.files.forEach((srcDirFile) => {
                    if (srcDirFile.type === 'directory' && srcDirFile.name === 'meta') {
                        metadata.listFiles(srcPath + '/meta').subscribe((metaDir) => {
                            const taskCollection: TaskCollection<EntityTarget> = {
                                collectionName: metadata.project.name,
                                tasks: []
                            };
                            metaDir.files.forEach((metaDirFile) => {
                                console.log('EntityProjects - metaDirFile', metaDirFile);
                                taskCollection.tasks.push({
                                    taskName: metaDirFile.name,
                                    task: {
                                        projectName: metadata.project.name,
                                        targetName: metaDirFile.name,
                                        metadata: metadata
                                    }
                                });
                            });
                            this.entityTasks.push(taskCollection);
                            tasksSubject.next({
                                taskCollections: this.entityTasks,
                                selectedTask: null
                            });
                        });
                    }
                });
            });
        });
    }
}
