/* eslint-disable @typescript-eslint/naming-convention */

const Types = {
  ExtensionContext: Symbol.for('ExtensionContext'),
  IStatusBar: Symbol.for('IStatusBar'),

  CreateProjectCmd: Symbol.for('CreateProjectCmd'),
  OpenHelpCmd: Symbol.for('OpenHelpCmd'),
  AttachProjectTilesCmd: Symbol.for('AttachProjectTilesCmd'),
  AttachProjectSpritesCmd: Symbol.for('AttachProjectSpritesCmd'),
  AttachProjectMapTilesetCmd: Symbol.for('AttachProjectMapTilesetCmd'),
  CreateSpritesCmd: Symbol.for('CreateSpritesCmd'),

  ConfigurationService: Symbol.for('ConfigurationService'),
  OutputChannelService: Symbol.for('OutputChannelService'),
  TerminalService: Symbol.for('TerminalService'),
  Z88dkProjectService: Symbol.for('Z88dkProjectService'),
  Z88dkReportService: Symbol.for('Z88dkReportService'),
  Z88dkBreakpointService: Symbol.for('Z88dkBreakpointService'),
  SjasmPlusProjectService: Symbol.for('SjasmPlusProjectService'),
};

export { Types };
