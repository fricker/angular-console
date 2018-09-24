
import { readFileSync, readdirSync } from 'fs';
import { readJsonFile } from './utils';

interface Project {
    name: string;
    root: string;
    projectType: string;
}

export function readResourceContext(project: Project, workspacePath: string, resourcePath: string): string {
    if (project.projectType === 'library') return '{}';
    const optionsPath = workspacePath + '/' + project.root + '/src/meta/options.json';
    return readFileSync(optionsPath).toString();
}

export function readResourceContent(project: Project, workspacePath: string, resourcePath: string): string {
    const contentPath = workspacePath + '/' + project.root + '/src/meta/' + resourcePath;
    return extendContent(workspacePath, resourcePath, readFileSync(contentPath).toString());
}

function extendContent(workspacePath: string, resourcePath: string, content: string): string {
    if (resourcePath === 'extensions.json') {
        const libraries: {projectName: string, directory: string[]}[] = JSON.parse(content).libraries;
        if (!libraries) {
            return;
        }
        const projects: {[name: string]: Project} = readJsonFile('./angular.json', workspacePath).json.projects;
        libraries.forEach((library) => {
            const project = projects[library.projectName];
            if (!project) {
                throw new Error('extendContent failure - project not found: ' + library.projectName);
            }
            const libPath = workspacePath + '/' + project.root + '/src/lib';
            library.directory = readdirSync(libPath);
        });
        return JSON.stringify({libraries: libraries});
    }
    return content;
}
