
import { Subject } from 'rxjs';
import { LocalFile } from '@angular-console/schema';
import { Task, TaskCollection, TaskCollections } from '@angular-console/ui';
import { ProjectMetadata } from '../project/metadata/project-metadata';

export interface ResourceTarget {
    projectName: string;
    resourcePath: string;
}

export class ResourceTasks<PM extends ProjectMetadata> {

    private tasksCollectionsSubject: Subject<TaskCollections<ResourceTarget>>;
    private tasksCollections: Array<TaskCollection<ResourceTarget>>;
    selectedProject: PM | null = null;

    constructor(public workspacePath: string, public projectMetadata: Array<PM>,
                private resourceTarget: ResourceTarget, private skipDirectories?: string[]) {}

    set tasksSubject(tasksSubject: Subject<TaskCollections<ResourceTarget>>) {
        this.tasksCollectionsSubject = tasksSubject;
        this.projectMetadata.forEach((metadata) => {
            this.scanMetadata(metadata);
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
        metadata.listFiles(dirPath).subscribe((metaDir) => {
            const metaDirectories: LocalFile[] = [];
            let collectionName = metadata.project.name;
            if (path.length) {
                collectionName += ' - ' + path.join(' - ');
            }
            const taskCollection: TaskCollection<ResourceTarget> = {
                collectionName: collectionName,
                tasks: []
            };
            metaDir.files.forEach((resourceFile) => {
                if (resourceFile.type === 'file') {
                    let resourcePath = resourceFile.name;
                    if (path.length) {
                        resourcePath = path.join('/') + '/' + resourcePath;
                    }
                    taskCollection.tasks.push({
                        taskName: resourceFile.name,
                        task: {
                            projectName: metadata.project.name,
                            resourcePath: resourcePath
                        }
                    });
                } else {
                    metaDirectories.push(resourceFile);
                }
            });
            if (taskCollection.tasks.length) {
                this.addTaskCollection(taskCollection);
            }
            metaDirectories.forEach((dir) => {
                if (!this.skipDirectories || this.skipDirectories.indexOf(dir.name) === -1) {
                    this.scanDirectory(metadata, basePath, [...path, dir.name]);
                }
            });
        });
    }

    protected addTaskCollection(taskCollection: TaskCollection<ResourceTarget>) {
        this.tasksCollections = this.tasksCollections ? [...this.tasksCollections, taskCollection] : [taskCollection];
        this.tasksCollectionsSubject.next({
            taskCollections: this.tasksCollections,
            selectedTask: this.getSelectedTask()
        });
    }

    private getSelectedTask(): Task<ResourceTarget> | null {
        if (!this.resourceTarget.projectName || !this.resourceTarget.resourcePath) {
          return null;
        }
        const selectedTask = this.tasksCollections.reduce(
            (tasks, collection) => [...tasks, ...collection.tasks],
            [] as Array<Task<ResourceTarget>>
          ).find(
            ({ task }) =>
              task.projectName === this.resourceTarget.projectName &&
              task.resourcePath === this.resourceTarget.resourcePath
          );
        return selectedTask || null;
    }
}
