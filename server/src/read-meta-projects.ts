
import { readdirSync } from 'fs';

const PLATFORMS = ['web'];

interface Project {
    name: string;
    root: string;
    projectType: string;
}

interface MetaProject extends Project {
    platformType?: string;
    meta: string[];
}

export function readMetaProjects(basedir: string, projects: {[name: string]: Project}): MetaProject[] {
    const metaProjects: MetaProject[] = [];
    Object.entries(projects).map(([name, project]) => {
        const dirPath = basedir + '/' + project.root + '/src/meta';
        if (project.projectType === 'library') {
            PLATFORMS.forEach((platformType) => {
                const libraryProject = createLibraryProject(name, project, dirPath, platformType);
                if (libraryProject) {
                    metaProjects.push(libraryProject);
                }
            });
        } else {
            const appProject = createMetaProject(name, project, dirPath);
            if (appProject) {
                metaProjects.push(appProject);
            }
        }
    });
    return metaProjects;
}

function createLibraryProject(name: string, project: Project, dirPath: string, platformType: string): MetaProject | undefined {
    const platformPath = dirPath + '/' + platformType;
    const libraryProject = createMetaProject(name, project, platformPath);
    if (libraryProject) {
        libraryProject.platformType = platformType;
        return libraryProject;
    }
}

function createMetaProject(name: string, project: Project, dirPath: string): MetaProject | undefined {
    try {
        return {
            name: name,
            root: project.root,
            projectType: project.projectType,
            meta: readdirSync(dirPath)
        };
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('readMetaProjects error', error);
        }
    }
}
