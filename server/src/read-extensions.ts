export function readExtensions(packageJson: any) {
  return availableExtensions().filter(e => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[e.name];
    const hasDevDep =
      packageJson.devDependencies && packageJson.devDependencies[e.name];
    return hasDep || hasDevDep;
  });
}

export function availableExtensions() {
  return [
    {
      name: '@nrwl/schematics',
      description:
        'Nx is an extension for the the Angular CLI implementing the monorepo-style development.',
      detailedDescription:
        'Nx is an extension for the the Angular CLI implementing the monorepo-style development. It is also a collection of runtime libraries, linters, and code generators helping large teams build better with Angular.'
    },
    { name: '@angular-toolkit/serverless', description: 'Serverless support' },
    {
      name: '@angular/elements',
      description: 'Support for using Angular components as custom elements'
    },
    { name: '@angular/material', description: 'Angular Material' },
    {
      name: '@angular/pwa',
      description: 'PWA support for Angular'
    },
    { name: '@clr/angular', description: 'Clarity components' },
    {
      name: '@mbd/schematics',
      description: 'Meta By Design'
    },
    {
      name: '@nativescript/schematics',
      description: 'NativeScript Support'
    },
    { name: '@ngrx/effects', description: 'NgRx side effect management' },
    {
      name: '@ngrx/store',
      description: 'NgRx state management'
    },
    {
      name: '@progress/kendo-angular-conversational-ui',
      description: 'Kendo UI Conversational components'
    },
    {
      name: '@progress/kendo-angular-excel-export',
      description: 'Kendo UI Excel Export component'
    },
    {
      name: '@progress/kendo-angular-menu',
      description: 'Kendo UI Menu component'
    },
    {
      name: '@progress/kendo-angular-pdf-export',
      description: 'Kendo UI PDF Export Component'
    },
    {
      name: '@progress/kendo-angular-popup',
      description: 'Kendo UI Popup component'
    },
    {
      name: '@progress/kendo-angular-scrollview',
      description: 'Kendo UI ScrollView Component'
    },
    {
      name: '@progress/kendo-angular-sortable',
      description: 'Kendo UI Sortable component'
    },
    {
      name: '@progress/kendo-angular-toolbar',
      description: 'Kendo UI Toolbar component'
    },
    {
      name: '@progress/kendo-angular-upload',
      description: 'Kendo UI Upload component'
    },
    { name: '@progress/kendo-schematics', description: 'Kendo UI schematics' },
    {
      name: 'ng-zorro-antd',
      description:
        'An enterprise-class UI components based on Ant Design and Angular'
    },
    {
      name: 'ngcli-wallaby',
      description: 'A schematic to add wallabyJS config to Angular project'
    }
  ];
}
