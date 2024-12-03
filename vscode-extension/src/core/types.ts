/* eslint-disable @typescript-eslint/naming-convention */

const Types = {
  ExtensionContext: Symbol.for('ExtensionContext'),
  IStatusBar: Symbol.for('IStatusBar'),

  CreateProjectCmd: Symbol.for('CreateProjectCmd'),
  ConfigureZ88dkProjectCmd: Symbol.for('ConfigureZ88dkProjectCmd'),

  OutputChannelService: Symbol.for('OutputChannelService'),
  Z88dkBreakpointService: Symbol.for('Z88dkBreakpointService'),
  Z88dkProjectService: Symbol.for('Z88dkProjectService'),
  Z88dkReportService: Symbol.for('Z88dkReportService'),
  SjasmPlusProjectService: Symbol.for('SjasmPlusProjectService'),
};

export { Types };
