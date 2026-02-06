/* eslint-disable @typescript-eslint/naming-convention */

const Types = {
  ExtensionContext: Symbol.for('ExtensionContext'),
  IStatusBar: Symbol.for('IStatusBar'),

  CreateProjectCmd: Symbol.for('CreateProjectCmd'),
  OpenHelpCmd: Symbol.for('OpenHelpCmd'),
  AttachProjectGraphicsCmd: Symbol.for('AttachProjectGraphicsCmd'),

  ConfigurationService: Symbol.for('ConfigurationService'),
  OutputChannelService: Symbol.for('OutputChannelService'),
  TerminalService: Symbol.for('TerminalService'),
  Z88dkProjectService: Symbol.for('Z88dkProjectService'),
  Z88dkReportService: Symbol.for('Z88dkReportService'),
  Z88dkBreakpointService: Symbol.for('Z88dkBreakpointService'),
  SjasmPlusProjectService: Symbol.for('SjasmPlusProjectService'),
};

export { Types };
