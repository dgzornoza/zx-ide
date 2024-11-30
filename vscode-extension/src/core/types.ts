/* eslint-disable @typescript-eslint/naming-convention */

const Types = {
  ExtensionContext: Symbol.for('ExtensionContext'),
  IStatusBar: Symbol.for('IStatusBar'),

  CreateProjectCmd: Symbol.for('CreateProjectCmd'),
  ConfigureZ88dkProjectCmd: Symbol.for('ConfigureZ88dkProjectCmd'),

  Z88dkBreakpointService: Symbol.for('Z88dkBreakpointService'),
  Z88dkProjectService: Symbol.for('Z88dkProjectService'),
  SjasmPlusProjectService: Symbol.for('SjasmPlusProjectService'),
};

export { Types };
