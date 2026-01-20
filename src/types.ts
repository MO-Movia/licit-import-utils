/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export interface Message {
  type: string;
  message: string;
}
export type MessageSink = (type: string, message: string) => void;
