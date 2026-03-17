export type StatusMessageType = "success" | "error";

export interface StatusMessage {
  type: StatusMessageType;
  text: string;
}
