
import { readFileSync } from 'fs';

interface Project {
    name: string;
    root: string;
    projectType: string;
}

export function readResourceContent(project: Project, workspacePath: string, resourcePath: string): string {
    const contentPath = workspacePath + '/' + project.root + '/src/meta/' + resourcePath;
    return readFileSync(contentPath).toString();
}

export function readResourceContext(project: Project, workspacePath: string, resourcePath: string): string {
    if (project.projectType === 'library') return '{}';
    const optionsPath = workspacePath + '/' + project.root + '/src/meta/options.json';
    return readFileSync(optionsPath).toString();
}
