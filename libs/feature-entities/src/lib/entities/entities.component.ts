import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Task, TaskCollection, TaskCollections } from '@angular-console/ui';
import { Project } from '@angular-console/schema';
import { Finder } from '@angular-console/utils';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable, ReplaySubject, combineLatest, Subscription } from 'rxjs';
import {
  map,
  switchMap,
  filter,
  startWith,
  distinctUntilChanged
} from 'rxjs/operators';
import { EntityMetadata } from '../entity/entity-metadata';
import { EntityProjects, EntityTarget } from './entity-projects';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss']
})
export class EntitiesComponent implements OnInit, OnDestroy {

  private readonly projects$: Observable<Array<Project>> = this.route.params.pipe(
    map(m => m.path),
    switchMap(path => {
      return this.apollo.watchQuery({
        pollInterval: 5000,
        query: gql`
          query($path: String!) {
            workspace(path: $path) {
              projects {
                name
                root
                projectType
              }
            }
          }
        `,
        variables: {
          path
        }
      }).valueChanges;
    }),
    map(r => {
      return [...(r as any).data.workspace.projects];
    })
  );

  private readonly selectedTargetId$: Observable<EntityTarget> = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const firstChild = this.route.snapshot.firstChild;
      if (firstChild) {
        return {
          projectName: decodeURIComponent(firstChild.params.project),
          targetName: decodeURIComponent(firstChild.params.target)
        };
      }
      return {
        projectName: '',
        targetName: ''
      };
    }),
    distinctUntilChanged(
      (a: EntityTarget, b: EntityTarget) =>
        a.projectName === b.projectName && a.targetName === b.targetName
    )
  );

  private entityTasksSubject = new ReplaySubject<TaskCollections<EntityTarget>>(1);
  readonly projectTasks$ = this.entityTasksSubject.asObservable();

  readonly workspaceProjects$: Observable<EntityProjects<EntityMetadata>> =
    combineLatest(this.projects$, this.selectedTargetId$).pipe(
      map(([projects, target]) => {
        const metadataArray: Array<EntityMetadata> = projects.map(
          project => new EntityMetadata(project, this.finder)
        );
        return new EntityProjects<EntityMetadata>(this.route.snapshot.params.path, metadataArray, target);
      })
    );

  private projectsub: Subscription;

  constructor(
    private readonly apollo: Apollo,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly finder: Finder
  ) {}

  ngOnInit() {
    this.projectsub = this.workspaceProjects$.subscribe((entityProjects) => {
      entityProjects.entityTasksSubject = this.entityTasksSubject;
    });
  }

  ngOnDestroy() {
    if (this.projectsub) {
      this.projectsub.unsubscribe();
    }
  }

  navigateToSelectedTarget(target: EntityTarget | null) {
    if (target) {
      this.router.navigate(
        [
          encodeURIComponent(target.projectName),
          encodeURIComponent(target.targetName)
        ],
        { relativeTo: this.route }
      );
    } else {
      this.router.navigate(['.'], { relativeTo: this.route });
    }
  }
}
