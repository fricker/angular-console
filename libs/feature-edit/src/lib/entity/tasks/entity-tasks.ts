
import { Subject } from 'rxjs';
import { LocalFile } from '@angular-console/schema';
import { TaskCollection, TaskCollections } from '@angular-console/ui';
import { ProjectMetadata } from '../../project/metadata/project-metadata';

export interface EntityTarget {
    projectName: string;
    targetPath: string;
}

export class EntityTasks<PM extends ProjectMetadata> {

    private tasksSubject: Subject<TaskCollections<EntityTarget>>;
    private tasksCollections: Array<TaskCollection<EntityTarget>>;
    selectedProject: PM | null = null;

    constructor(public workspacePath: string, public projectMetadata: Array<PM>,
                private target: EntityTarget, private skipDirectories?: string[]) {}

    set entityTasksSubject(tasksSubject: Subject<TaskCollections<EntityTarget>>) {
        this.tasksSubject = tasksSubject;
        this.projectMetadata.forEach((metadata) => {
            this.scanMetadata(metadata);
        });
    }

    protected addTaskCollection(taskCollection: TaskCollection<EntityTarget>) {
        this.tasksCollections = this.tasksCollections ? [...this.tasksCollections, taskCollection] : [taskCollection];
        this.tasksSubject.next({
            taskCollections: this.tasksCollections,
            selectedTask: null
        });
    }

    private scanMetadata(metadata: PM) {
        const srcDirPath = this.workspacePath + '/' + metadata.project.root + '/src';
        metadata.listFiles(srcDirPath).subscribe((srcDir) => {
            srcDir.files.forEach((srcDirFile) => {
                if (srcDirFile.type === 'directory' && srcDirFile.name === 'meta') {
                    this.scanDirectory(metadata, srcDirPath + '/meta', []);
                }
            });
        });
    }

    private scanDirectory(metadata: PM, basePath: string, path: string[]) {
        const dirPath = path.length ? basePath + '/' + path.join('/') : basePath;
        metadata.listFiles(dirPath).subscribe((targetDir) => {
            const targetDirectories: LocalFile[] = [];
            let collectionName = metadata.project.name;
            if (path.length) {
                collectionName += ' - ' + path.join(' - ');
            }
            const taskCollection: TaskCollection<EntityTarget> = {
                collectionName: collectionName,
                tasks: []
            };
            targetDir.files.forEach((targetFile) => {
                if (targetFile.type === 'file') {
                    let targetPath = targetFile.name;
                    if (path.length) {
                        targetPath = path.join('/') + '/' + targetPath;
                    }
                    taskCollection.tasks.push({
                        taskName: targetFile.name,
                        task: {
                            projectName: metadata.project.name,
                            targetPath: targetPath
                        }
                    });
                } else {
                    targetDirectories.push(targetFile);
                }
            });
            if (taskCollection.tasks.length) {
                this.addTaskCollection(taskCollection);
            }
            targetDirectories.forEach((dir) => {
                if (!this.skipDirectories || this.skipDirectories.indexOf(dir.name) === -1) {
                    this.scanDirectory(metadata, basePath, [...path, dir.name]);
                }
            });
        });
    }
}
